import { valuesAt } from "./terms";
import type { Filter, IndexedEntry, SearchResult } from "./types";

/** Field weights: what a registry can rank on when publishers never coordinated (ARD §4.2). */
const FIELD_WEIGHTS = {
	representativeQueries: 3,
	displayName: 3,
	capabilities: 2,
	tags: 2,
	lineOfBusiness: 2,
	description: 1,
	instructions: 0.5,
} as const;

type Field = keyof typeof FIELD_WEIGHTS;

const STOP = new Set([
	"a",
	"an",
	"the",
	"for",
	"to",
	"of",
	"in",
	"on",
	"and",
	"or",
	"my",
	"me",
	"i",
	"is",
	"it",
	"with",
	"how",
	"do",
	"can",
	"get",
	"find",
	"need",
	"want",
	"want",
	"que",
	"de",
	"la",
	"le",
	"les",
	"un",
	"une",
	"des",
	"du",
	"et",
	"en",
	"el",
	"los",
	"las",
	"y",
	"para",
]);

export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.split(/[^a-z0-9]+/)
		.filter((t) => t.length > 1 && !STOP.has(t));
}

type Doc = { indexed: IndexedEntry; fields: Record<Field, string[]> };

const docsCache: WeakMap<IndexedEntry[], { docs: Doc[]; idf: Map<string, number> }> = new WeakMap();

function buildDocs(entries: IndexedEntry[]): { docs: Doc[]; idf: Map<string, number> } {
	const hit = docsCache.get(entries);
	if (hit) return hit;
	const docs: Doc[] = entries.map((indexed) => {
		const e = indexed.entry;
		const instructions =
			typeof e.metadata?.instructions === "string" ? e.metadata.instructions : "";
		return {
			indexed,
			fields: {
				representativeQueries: tokenize((e.representativeQueries ?? []).join(" ")),
				displayName: tokenize(`${e.displayName} ${indexed.publisher} ${indexed.host.displayName}`),
				capabilities: tokenize((e.capabilities ?? []).join(" ").replace(/[_-]/g, " ")),
				tags: tokenize((e.tags ?? []).join(" ")),
				lineOfBusiness: tokenize(
					[...(e["ofa:lineOfBusiness"] ?? []), ...(e["ofa:sector"] ?? [])].join(" "),
				),
				description: tokenize(e.description ?? ""),
				instructions: tokenize(instructions),
			},
		};
	});
	const df = new Map<string, number>();
	for (const d of docs) {
		const seen = new Set(Object.values(d.fields).flat());
		for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
	}
	const n = docs.length || 1;
	const idf = new Map<string, number>();
	for (const [t, f] of df) idf.set(t, Math.log(1 + (n - f + 0.5) / (f + 0.5)));
	const built = { docs, idf };
	docsCache.set(entries, built);
	return built;
}

function matches(queryToken: string, docToken: string): boolean {
	if (queryToken === docToken) return true;
	if (queryToken.length >= 4 && docToken.startsWith(queryToken)) return true;
	if (docToken.length >= 4 && queryToken.startsWith(docToken)) return true;
	return false;
}

/** Relevance 0–100. Informational only; never a trust or safety rating (ARD §5.3.2). */
function score(doc: Doc, queryTokens: string[], idf: Map<string, number>, maxIdf: number): number {
	let s = 0;
	let ceiling = 0;
	for (const q of queryTokens) {
		const weightIdf = idf.get(q) ?? maxIdf;
		for (const field of Object.keys(FIELD_WEIGHTS) as Field[]) {
			const w = FIELD_WEIGHTS[field];
			ceiling += w * weightIdf * 0.5;
			let tf = 0;
			for (const t of doc.fields[field]) if (matches(q, t)) tf += q === t ? 1 : 0.6;
			if (tf > 0) s += w * weightIdf * (tf / (tf + 1));
		}
	}
	if (ceiling === 0) return 0;
	return Math.min(100, Math.round((100 * s) / (ceiling * 0.6)));
}

export function normalizeFilter(raw: unknown): Filter {
	const out: Filter = {};
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
	for (const [k, v] of Object.entries(raw)) {
		if (k === "@context") continue;
		const values = (Array.isArray(v) ? v : [v]).filter((x): x is string | number | boolean =>
			["string", "number", "boolean"].includes(typeof x),
		);
		if (values.length) out[k] = values.map(String);
	}
	return out;
}

export function matchesFilter(
	indexed: IndexedEntry,
	filter: Filter,
	context: Record<string, string> = {},
): boolean {
	for (const [key, wanted] of Object.entries(filter)) {
		const have = valuesAt(indexed, key, context).map((v) => v.toLowerCase());
		if (!wanted.some((w) => have.includes(w.toLowerCase()))) return false;
	}
	return true;
}

/** The set Search and Explore both work over: same filter, same relevance cutoff (ARD §5.3.3). */
export function matchedSet(input: {
	entries: IndexedEntry[];
	text?: string;
	filter?: Filter;
	context?: Record<string, string>;
}): { indexed: IndexedEntry; score: number }[] {
	const { docs, idf } = buildDocs(input.entries);
	const filter = input.filter ?? {};
	const queryTokens = input.text ? tokenize(input.text) : [];
	const maxIdf = Math.max(...idf.values(), 1);
	const out: { indexed: IndexedEntry; score: number }[] = [];
	for (const doc of docs) {
		if (!matchesFilter(doc.indexed, filter, input.context)) continue;
		if (queryTokens.length === 0) {
			out.push({ indexed: doc.indexed, score: 0 });
			continue;
		}
		const s = score(doc, queryTokens, idf, maxIdf);
		if (s >= RELEVANCE_CUTOFF) out.push({ indexed: doc.indexed, score: s });
	}
	if (queryTokens.length)
		out.sort(
			(a, b) =>
				b.score - a.score || a.indexed.entry.displayName.localeCompare(b.indexed.entry.displayName),
		);
	else out.sort((a, b) => a.indexed.entry.displayName.localeCompare(b.indexed.entry.displayName));
	return out;
}

/** Entries scoring under this are excluded from results and facets alike. */
export const RELEVANCE_CUTOFF = 8;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export function encodePageToken(offset: number): string {
	return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

export function decodePageToken(token: string | undefined): number {
	if (!token) return 0;
	try {
		const parsed: unknown = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
		if (
			parsed &&
			typeof parsed === "object" &&
			"offset" in parsed &&
			typeof parsed.offset === "number" &&
			parsed.offset >= 0
		) {
			return Math.floor(parsed.offset);
		}
	} catch {
		// fall through
	}
	throw new Error("INVALID_PAGE_TOKEN");
}

export function search(input: {
	entries: IndexedEntry[];
	text: string;
	filter?: Filter;
	context?: Record<string, string>;
	pageSize?: number;
	pageToken?: string;
	source: string;
}): { results: SearchResult[]; pageToken?: string; total: number } {
	const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
	const offset = decodePageToken(input.pageToken);
	const all = matchedSet(input);
	const page = all.slice(offset, offset + pageSize);
	const results = page.map(({ indexed, score }) => ({
		entry: indexed.entry,
		publisher: indexed.publisher,
		score,
		source: input.source,
	}));
	const next = offset + pageSize < all.length ? encodePageToken(offset + pageSize) : undefined;
	return next ? { results, pageToken: next, total: all.length } : { results, total: all.length };
}
