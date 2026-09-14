import { ARD_NAMESPACE, type Entry, FC_NAMESPACE, FC_PREFIX, type IndexedEntry } from "./types";

/**
 * Resolves a filter key or entry key to the IRI it denotes, the way ARD §5.3.1 asks:
 * core terms live in the ARD namespace, `fc:*` in the FinCommons namespace, and a
 * publisher's own prefix resolves through the `@context` it declared.
 * Dot paths keep their tail as a literal JSON path (`metadata.platform`).
 */
export function resolveKey(
	key: string,
	context: Record<string, string> = {},
): { iri: string; path: string[] } {
	const [head = "", ...tail] = key.split(".");
	if (head.startsWith("http://") || head.startsWith("https://")) return { iri: head, path: tail };
	const colon = head.indexOf(":");
	if (colon > 0) {
		const prefix = head.slice(0, colon);
		const local = head.slice(colon + 1);
		const base = prefix === FC_PREFIX ? FC_NAMESPACE : context[prefix];
		if (base) return { iri: base + local, path: tail };
	}
	return { iri: ARD_NAMESPACE + head, path: tail };
}

/** Prefix bindings an entry declares in its own `@context`, ignoring string contexts (they are the base context). */
export function contextPrefixes(entry: Entry): Record<string, string> {
	const ctx = entry["@context"];
	const out: Record<string, string> = {};
	const objects: Record<string, unknown>[] = [];
	if (Array.isArray(ctx)) for (const c of ctx) if (typeof c === "object" && c) objects.push(c);
	if (ctx && typeof ctx === "object" && !Array.isArray(ctx)) objects.push(ctx);
	for (const o of objects)
		for (const [k, v] of Object.entries(o)) if (typeof v === "string") out[k] = v;
	return out;
}

function walk(value: unknown, path: string[]): unknown {
	let cur = value;
	for (const seg of path) {
		if (Array.isArray(cur)) {
			cur = cur.flatMap((item) =>
				item && typeof item === "object" ? [(item as Record<string, unknown>)[seg]] : [],
			);
		} else if (cur && typeof cur === "object") {
			cur = (cur as Record<string, unknown>)[seg];
		} else return undefined;
	}
	return cur;
}

function toStrings(value: unknown): string[] {
	if (value === undefined || value === null) return [];
	if (Array.isArray(value)) return value.flatMap(toStrings);
	if (typeof value === "object") return [];
	return [String(value)];
}

/** Every string an entry holds under a term, by IRI. `publisher` is derived from the URN. */
export function valuesAt(
	indexed: IndexedEntry,
	key: string,
	queryContext: Record<string, string> = {},
): string[] {
	const wanted = resolveKey(key, queryContext);
	if (wanted.iri === `${ARD_NAMESPACE}publisher` && wanted.path.length === 0)
		return [indexed.publisher];
	const prefixes = contextPrefixes(indexed.entry);
	const record: Record<string, unknown> = indexed.entry;
	for (const [entryKey, value] of Object.entries(record)) {
		if (entryKey.startsWith("@")) continue;
		const resolved = resolveKey(entryKey, prefixes);
		if (resolved.iri !== wanted.iri) continue;
		return toStrings(walk(value, wanted.path));
	}
	return [];
}
