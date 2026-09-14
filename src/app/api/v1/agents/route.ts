import { parseListFilter } from "@/lib/api/query";
import { apiError, json, preflight } from "@/lib/api/respond";
import { getRegistry } from "@/lib/registry/load";
import { decodePageToken, encodePageToken, matchesFilter } from "@/lib/registry/search";

export const OPTIONS = preflight;

/** Deterministic, cacheable listing (ARD §5.3.4). No relevance ranking; sorted by displayName. */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const filter = parseListFilter(url.searchParams.get("filter"));
	const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20) || 20));
	let offset: number;
	try {
		offset = decodePageToken(url.searchParams.get("pageToken") ?? undefined);
	} catch {
		return apiError(400, "INVALID_ARGUMENT", "pageToken is not valid.");
	}
	const orderBy = url.searchParams.get("orderBy") ?? "displayName";
	const desc = /\sdesc$/i.test(orderBy);
	const all = getRegistry()
		.entries.filter((e) => matchesFilter(e, filter))
		.sort((a, b) => {
			const key = orderBy.replace(/\s+(asc|desc)$/i, "");
			const av = key === "updatedAt" ? (a.entry.updatedAt ?? "") : a.entry.displayName;
			const bv = key === "updatedAt" ? (b.entry.updatedAt ?? "") : b.entry.displayName;
			return desc ? bv.localeCompare(av) : av.localeCompare(bv);
		});
	const page = all.slice(offset, offset + pageSize);
	return json(
		{
			agents: page.map((e) => ({ ...e.entry, publisher: e.publisher })),
			...(offset + pageSize < all.length ? { pageToken: encodePageToken(offset + pageSize) } : {}),
			total: all.length,
		},
		{ cache: "public, max-age=300, s-maxage=3600" },
	);
}
