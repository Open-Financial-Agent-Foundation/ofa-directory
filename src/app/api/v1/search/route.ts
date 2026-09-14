import { queryContext, queryFilter, searchBodySchema } from "@/lib/api/query";
import { apiError, json, preflight } from "@/lib/api/respond";
import { getRegistry } from "@/lib/registry/load";
import { search } from "@/lib/registry/search";
import { apiBase } from "@/lib/site";

export const OPTIONS = preflight;

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError(400, "INVALID_ARGUMENT", "Body must be JSON.");
	}
	const parsed = searchBodySchema.safeParse(body);
	if (!parsed.success) {
		return apiError(
			400,
			"INVALID_ARGUMENT",
			parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
		);
	}
	const { query, pageSize, pageToken } = parsed.data;
	try {
		const result = search({
			entries: getRegistry().entries,
			text: query.text,
			filter: queryFilter(query),
			context: queryContext(query),
			pageSize,
			pageToken,
			source: apiBase(request),
		});
		return json({
			results: result.results.map((r) => ({
				...r.entry,
				publisher: r.publisher,
				score: r.score,
				source: r.source,
			})),
			...(result.pageToken ? { pageToken: result.pageToken } : {}),
			total: result.total,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "INVALID_PAGE_TOKEN")
			return apiError(400, "INVALID_ARGUMENT", "pageToken is not valid.");
		console.error("[fincommons] search failed", { error });
		return apiError(500, "INTERNAL", "Search failed.");
	}
}
