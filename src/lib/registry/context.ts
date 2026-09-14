import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import { matchedSet } from "./search";
import { type Filter, type IndexedEntry, KNOWN_TYPES } from "./types";

export type ContextSource = {
	identifier: string;
	displayName: string;
	publisher: string;
	url: string;
	tool: string | null;
	text: string;
	error?: string;
};

/** Tool names that read like "answer a question from what you know" rather than "start a quote". */
const KNOWLEDGE_TOOL =
	/^(search|faq|search_faq|search_terms|fetch|ask_[a-z_]+|explain_[a-z_]+|[a-z_]*_(info|search|question|catalogue))$/i;
const PREFERRED_ARGS = ["query", "question", "q", "text", "message", "input", "prompt"];

const toolSchema = z.looseObject({
	name: z.string(),
	inputSchema: z
		.looseObject({
			properties: z.record(z.string(), z.looseObject({ type: z.unknown().optional() })).optional(),
		})
		.optional(),
});

const resultSchema = z.looseObject({
	content: z.array(z.looseObject({ type: z.string(), text: z.string().optional() })).optional(),
	structuredContent: z.unknown().optional(),
	isError: z.boolean().optional(),
});

function pickTool(tools: unknown): { name: string; argName: string } | null {
	const parsed = z.array(toolSchema).safeParse(tools);
	if (!parsed.success) return null;
	for (const tool of parsed.data) {
		if (!KNOWLEDGE_TOOL.test(tool.name) || tool.name === "fetch") continue;
		const props = tool.inputSchema?.properties ?? {};
		const stringProps = Object.entries(props)
			.filter(([, v]) => v.type === "string")
			.map(([k]) => k);
		const argName = PREFERRED_ARGS.find((a) => stringProps.includes(a)) ?? stringProps[0];
		if (argName) return { name: tool.name, argName };
	}
	return null;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
		p.then(
			(v) => {
				clearTimeout(t);
				resolve(v);
			},
			(e) => {
				clearTimeout(t);
				reject(e);
			},
		);
	});
}

/** Connects to one provider's MCP server, finds its knowledge tool, asks it the question. */
export async function askProvider(input: {
	indexed: IndexedEntry;
	question: string;
	timeoutMs: number;
}): Promise<ContextSource> {
	const { entry } = input.indexed;
	const base: ContextSource = {
		identifier: entry.identifier,
		displayName: entry.displayName,
		publisher: input.indexed.publisher,
		url: entry.url ?? "",
		tool: null,
		text: "",
	};
	if (!entry.url) return { ...base, error: "entry has no url" };
	const client = new Client({ name: "open-financial-agent", version: "0.1.0" });
	try {
		const transport = new StreamableHTTPClientTransport(new URL(entry.url));
		await withTimeout(client.connect(transport), input.timeoutMs, "connect");
		const listed = await withTimeout(client.listTools(), input.timeoutMs, "tools/list");
		const picked = pickTool(listed.tools);
		if (!picked) return { ...base, error: "no knowledge tool exposed (quote-only server)" };
		const raw = await withTimeout(
			client.callTool({ name: picked.name, arguments: { [picked.argName]: input.question } }),
			input.timeoutMs,
			`tools/call ${picked.name}`,
		);
		const result = resultSchema.parse(raw);
		const texts = (result.content ?? []).flatMap((c) =>
			c.type === "text" && c.text ? [c.text] : [],
		);
		let text = texts.join("\n\n").trim();
		if (!text && result.structuredContent !== undefined)
			text = JSON.stringify(result.structuredContent, null, 2);
		if (result.isError)
			return {
				...base,
				tool: picked.name,
				text: "",
				error: text.slice(0, 300) || "tool returned an error",
			};
		return { ...base, tool: picked.name, text: text.slice(0, 6000) };
	} catch (error) {
		return { ...base, error: error instanceof Error ? error.message : String(error) };
	} finally {
		await client.close().catch(() => undefined);
	}
}

/**
 * The Mintlify-style `context` operation: rank the providers that fit the question, then ask
 * each one's own MCP server and return what they said, cited. Open Financial Agent never answers itself.
 */
export async function buildContext(input: {
	entries: IndexedEntry[];
	question: string;
	filter?: Filter;
	maxSources?: number;
	timeoutMs?: number;
}): Promise<{ sources: ContextSource[]; markdown: string; considered: number }> {
	const maxSources = Math.min(5, Math.max(1, input.maxSources ?? 3));
	const timeoutMs = input.timeoutMs ?? 12000;
	const ranked = matchedSet({
		entries: input.entries,
		text: input.question,
		filter: input.filter,
	}).filter(({ indexed }) => indexed.entry.type === KNOWN_TYPES.mcpServer && indexed.entry.url);
	const picked = ranked.slice(0, maxSources);
	const sources = await Promise.all(
		picked.map(({ indexed }) => askProvider({ indexed, question: input.question, timeoutMs })),
	);
	const sections = sources.map((s) => {
		const head = `### ${s.displayName}\nSource: ${s.url}${s.tool ? ` (tool: ${s.tool})` : ""}\nEntry: ${s.identifier}`;
		if (s.error) return `${head}\n\n_No answer: ${s.error}_`;
		return `${head}\n\n${s.text || "_Empty answer._"}`;
	});
	const markdown = sections.length
		? sections.join("\n\n--------------------------------\n\n")
		: "No indexed provider with a live MCP endpoint matched this question. Try `search` with a broader query or a filter.";
	return { sources, markdown, considered: ranked.length };
}
