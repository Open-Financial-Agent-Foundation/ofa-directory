import { apiError, json, preflight } from "@/lib/api/respond";
import { getRegistry } from "@/lib/registry/load";

export const OPTIONS = preflight;

/** The complete ARD entry for one identifier. Out of the spec's scope, and the thing every client ends up needing. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
	const { id } = await ctx.params;
	const hit = getRegistry().byIdentifier.get(decodeURIComponent(id));
	if (!hit) return apiError(404, "NOT_FOUND", "No entry with that identifier.");
	return json(
		{ ...hit.entry, publisher: hit.publisher, host: hit.host, origin: hit.origin },
		{ cache: "public, max-age=300, s-maxage=3600" },
	);
}
