import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import { assertPublicUrl, guardedFetch } from "@/lib/net/guarded-fetch";
import type { FC_ACTIONS } from "./types";

const TIMEOUT_MS = 12_000;

const toolSchema = z.looseObject({
	name: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
});

export type IntrospectedTool = { name: string; title?: string; description?: string };

export type Draft = {
	/** Where the endpoint is served. A publisher may own a different domain, so the form lets them say so. */
	endpointHost: string;
	/** The domain the identifier is anchored to (ARD §4.5.1). Defaults to the endpoint host. */
	publisher: string;
	/** Stable half of the identifier; the form recomposes the URN when the domain changes. */
	slug: string;
	displayName: string;
	identifier: string;
	url: string;
	version?: string;
	description: string;
	capabilities: string[];
	/** Suggested, never authoritative: the publisher rewrites these before submitting. */
	suggestedQueries: string[];
	suggestedActions: string[];
	tools: IntrospectedTool[];
	instructions?: string;
};

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
}

/**
 * A tool that only renders a card describes the card rather than what the service does, which
 * makes it the worst source for a description, a query or an action.
 *
 * Widget metadata (`ui/resourceUri`, `openai/outputTemplate`) looks like the reliable signal and
 * is not: a functional tool commonly carries an output template too, and treating that as display
 * dropped Tuio's price estimate and Mal Bazaar's quote flows, the very tools the entry is about.
 * The name and the opening verb are what actually separate the two.
 */
const DISPLAY_NAME_PREFIX = /^(show|display|render|select|review|affiche|muestra|exibe)[-_]/i;
const DISPLAY_NAME_SUFFIX =
	/[-_](card|cards|summary|result|results|chooser|confirm|confirmation|rejection|teaser|notice|view|widget)$/i;
const DISPLAY_VERB = /^(displays?|shows?|renders?|affiche|montre|muestra|exibe|mostra)\s/i;

function isDisplayTool(tool: IntrospectedTool): boolean {
	if (DISPLAY_NAME_PREFIX.test(tool.name) || DISPLAY_NAME_SUFFIX.test(tool.name)) return true;
	return DISPLAY_VERB.test((tool.description ?? "").trim());
}

/** The verb a tool performs, read from its name, title and opening line. A human confirms it. */
const ACTION_PATTERNS: [(typeof FC_ACTIONS)[number], RegExp][] = [
	["quote", /quote|cotar|cotiza|devis|tarif|pricing|price|estimate|presupuesto|prix/i],
	["simulate", /simulat|simulad|projection/i],
	["compare", /compar|comparaison|comparison/i],
	["callback", /callback|call_?back|rappel|lead|intake/i],
	["apply", /creation_|create_|apply|application|dossier|souscription|journey|parcours|onboard/i],
	["claim", /\bclaims?\b|sinistre|siniestro/i],
	["faq", /faq|ask_|explain_|_info|knowledge|frequently asked|questions? (?:about|sur|sobre)/i],
	["search", /search|recherche|busca|catalogue|catalog|lookup/i],
];

/**
 * Reads only the name, the title and the opening line. A whole description mentions too much of
 * the product's world and matches nearly every action, which leaves a publisher unchecking eight
 * boxes instead of confirming two.
 */
function inferActions(tools: IntrospectedTool[]): string[] {
	const found = new Set<string>();
	for (const tool of tools) {
		if (isDisplayTool(tool)) continue;
		const text = `${tool.name} ${tool.title ?? ""} ${(tool.description ?? "").slice(0, 140)}`;
		for (const [action, pattern] of ACTION_PATTERNS) {
			if (pattern.test(text)) found.add(action);
		}
	}
	return [...found];
}

const PRIMARY_ACTION =
	/quote|cotar|cotiza|devis|tarif|price|prix|estimate|presupuesto|loan|creation_|create_|souscription|apply/i;

/**
 * Whichever tool comes first in the list is an arbitrary choice and often the wrong one: Mal
 * Bazaar lists a callback recorder before its three quote flows. The tool the entry is about is
 * the one that quotes or applies, and failing that the one whose author wrote the most about it.
 */
function describingTool(tools: IntrospectedTool[]): IntrospectedTool | undefined {
	const candidates = tools.filter((t) => !isDisplayTool(t) && (t.description ?? "").length > 0);
	if (candidates.length === 0) return undefined;
	return candidates.sort((a, b) => {
		const rank = (t: IntrospectedTool) =>
			PRIMARY_ACTION.test(`${t.name} ${(t.description ?? "").slice(0, 140)}`) ? 0 : 1;
		return rank(a) - rank(b) || (b.description?.length ?? 0) - (a.description?.length ?? 0);
	})[0];
}

/**
 * Most tool descriptions say when to call the tool ("Use when a user wants to insure their dog").
 * That clause is the closest thing a server already carries to a query a person would type, so it
 * seeds the field the publisher rewrites in their own customers' words. The corpus answers in
 * French, Spanish and Portuguese too, and `\b` does not fire before an accented letter, so these
 * patterns anchor on whitespace instead.
 */
const WHEN_PATTERNS = [
	/(?:^|\s)use (?:this |it |them )?(?:tool )?when(?:ever)?\s+([^.!?]{8,160})/i,
	/(?:^|\s)(?:à (?:utiliser|appeler)|utilise[rz]?|appele[rz]?)\s+(?:quand|lorsqu['e])\s*([^.!?]{8,160})/i,
	/(?:^|\s)(?:usar|úsa(?:lo|la)|utiliza(?:r)?|use)\s+(?:cuando|quando)\s+([^.!?]{8,160})/i,
];

const LEADING_SUBJECT =
	/^(?:a |the |l[ea] |un |une |el |la )?(?:user|customer|visitor|someone|shopper|prospect|utilisateur|client|usuario|cliente)s?\s+/i;
const LEADING_VERB =
	/^(?:wants? to|asks? (?:about|for|to)|needs? to|mentions?|is |souhaite|veut|demande|quiere|desea)\s*/i;

/** A clause lifted out of a list, a path or a code span reads as debris, not as something anyone would type. */
function usableAsQuery(phrase: string): boolean {
	if (phrase.length < 10 || phrase.length > 90) return false;
	if (/[`_*<>{}]|\s-\s|:\s|\//.test(phrase)) return false;
	return /^[\p{Ll}\p{Lu}\p{N}]/u.test(phrase);
}

function suggestQueries(tools: IntrospectedTool[]): string[] {
	const out: string[] = [];
	for (const tool of tools) {
		if (isDisplayTool(tool)) continue;
		const description = tool.description ?? "";
		let clause: string | undefined;
		for (const pattern of WHEN_PATTERNS) {
			const match = pattern.exec(description);
			if (match?.[1]) {
				clause = match[1];
				break;
			}
		}
		if (!clause) continue;
		for (const part of clause.split(/,| or | ou /i)) {
			const phrase = part
				.trim()
				.replace(LEADING_SUBJECT, "")
				.replace(LEADING_VERB, "")
				.replace(/\s+/g, " ")
				.trim();
			if (!usableAsQuery(phrase) || out.includes(phrase)) continue;
			out.push(phrase);
		}
	}
	return out.slice(0, 6);
}

/**
 * Tool descriptions carry instructions written at the model, not at a reader: compliance clauses,
 * shouted prohibitions, "call this first" ordering notes. Lassie's quote tool ends in a paragraph
 * telling the model never to call Lassie an insurance company, which is true guidance and a poor
 * public description, so the draft stops at the first directive.
 */
const DIRECTIVE =
	/(?:COMPLIANCE|IMPORTANT|CRITICAL|WARNING|NEVER|ALWAYS|MUST NOT|DO NOT|R[EÈ]GLES?|REGLAS?|OBLIGATOIRE|TOUJOURS|JAMAIS|SIEMPRE|NUNCA)\b|^[A-Z]{4,}\s*:/;

function stripDirectives(text: string): string {
	const kept: string[] = [];
	for (const sentence of text.split(/(?<=[.!?])\s+/)) {
		if (DIRECTIVE.test(sentence)) break;
		kept.push(sentence.trim());
	}
	return (kept.join(" ") || text).trim();
}

function firstSentences(text: string, max: number): string {
	const flat = text.replace(/\s+/g, " ").trim();
	if (flat.length <= max) return flat;
	const cut = flat.slice(0, max);
	const stop = cut.lastIndexOf(". ");
	return stop > 80 ? cut.slice(0, stop + 1) : `${cut.trimEnd()}…`;
}

export class IntrospectError extends Error {}

/**
 * Connects to a candidate MCP endpoint and reads what it says about itself. Everything returned is
 * the publisher's own text, unverified, and exists to be edited before it reaches the registry.
 */
export async function introspect(rawUrl: string): Promise<Draft> {
	const url = await assertPublicUrl(rawUrl);
	const client = new Client({ name: "open-financial-agent-submit", version: "0.1.0" });
	try {
		const transport = new StreamableHTTPClientTransport(url, { fetch: guardedFetch(TIMEOUT_MS) });
		await client.connect(transport);

		const info = client.getServerVersion();
		const instructions = client.getInstructions();
		const listed = await client.listTools();
		const tools: IntrospectedTool[] = z
			.array(toolSchema)
			.parse(listed.tools)
			.map((t) => ({
				name: t.name,
				...(t.title ? { title: t.title } : {}),
				...(t.description ? { description: t.description } : {}),
			}));

		const endpointHost = url.hostname.replace(/^www\./, "");
		const displayName = info?.title ?? info?.name ?? endpointHost;
		const slug = slugify(info?.name ?? endpointHost.split(".")[0] ?? "agent") || "agent";
		const source =
			instructions ?? describingTool(tools)?.description ?? tools.map((t) => t.name).join(", ");
		const description = firstSentences(stripDirectives(source), 400);

		return {
			endpointHost,
			publisher: endpointHost,
			slug,
			displayName,
			identifier: `urn:air:${endpointHost}:agent:${slug}`,
			url: url.toString(),
			...(info?.version ? { version: info.version } : {}),
			description,
			capabilities: tools.map((t) => t.name),
			suggestedQueries: suggestQueries(tools),
			suggestedActions: inferActions(tools),
			tools,
			...(instructions ? { instructions: firstSentences(instructions, 600) } : {}),
		};
	} catch (error) {
		if (error instanceof IntrospectError) throw error;
		throw new IntrospectError(error instanceof Error ? error.message : String(error));
	} finally {
		await client.close().catch(() => undefined);
	}
}
