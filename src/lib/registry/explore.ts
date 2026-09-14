import { matchedSet } from "./search";
import { valuesAt } from "./terms";
import type { Filter, IndexedEntry } from "./types";

export type FacetRequest = { field: string; limit?: number; minCount?: number };
export type FacetBucket = { value: string; count: number };
export type FacetResult = { buckets: FacetBucket[]; otherCount?: number };

/** The facets the home page and `/explore` default to when a caller names none. */
export const DEFAULT_FACETS: FacetRequest[] = [
	{ field: "fc:sector" },
	{ field: "fc:lineOfBusiness" },
	{ field: "fc:country" },
	{ field: "type" },
	{ field: "publisher", limit: 50 },
	{ field: "fc:actions" },
	{ field: "fc:status" },
];

export function explore(input: {
	entries: IndexedEntry[];
	text?: string;
	filter?: Filter;
	context?: Record<string, string>;
	facets?: FacetRequest[];
}): { resultType: "facets"; matched: number; facets: Record<string, FacetResult> } {
	const set = matchedSet(input);
	const facets: Record<string, FacetResult> = {};
	for (const req of input.facets ?? DEFAULT_FACETS) {
		const counts = new Map<string, number>();
		for (const { indexed } of set) {
			for (const v of new Set(valuesAt(indexed, req.field, input.context)))
				counts.set(v, (counts.get(v) ?? 0) + 1);
		}
		const minCount = req.minCount ?? 1;
		const sorted = [...counts.entries()]
			.filter(([, c]) => c >= minCount)
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([value, count]) => ({ value, count }));
		const limit = Math.max(1, req.limit ?? 20);
		const buckets = sorted.slice(0, limit);
		const other = sorted.slice(limit).reduce((n, b) => n + b.count, 0);
		facets[req.field] = other > 0 ? { buckets, otherCount: other } : { buckets };
	}
	return { resultType: "facets", matched: set.length, facets };
}
