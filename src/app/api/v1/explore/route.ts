import { exploreBodySchema, queryContext, queryFilter } from "@/lib/api/query";
import { apiError, json, preflight } from "@/lib/api/respond";
import { explore } from "@/lib/registry/explore";
import { getRegistry } from "@/lib/registry/load";

export const OPTIONS = preflight;

export async function POST(request: Request) {
	let body: unknown = {};
	try {
		const text = await request.text();
		body = text ? JSON.parse(text) : {};
	} catch {
		return apiError(400, "INVALID_ARGUMENT", "Body must be JSON.");
	}
	const parsed = exploreBodySchema.safeParse(body);
	if (!parsed.success) {
		return apiError(
			400,
			"INVALID_ARGUMENT",
			parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
		);
	}
	const { query, resultType } = parsed.data;
	return json(
		explore({
			entries: getRegistry().entries,
			text: query?.text,
			filter: queryFilter(query),
			context: queryContext(query),
			facets: resultType?.facets,
		}),
	);
}
