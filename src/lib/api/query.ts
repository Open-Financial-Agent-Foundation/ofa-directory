import { z } from "zod";
import { normalizeFilter } from "@/lib/registry/search";
import type { Filter } from "@/lib/registry/types";

const filterValue = z.union([z.string(), z.number(), z.boolean()]);

export const querySchema = z.object({
	"@context": z.union([z.string(), z.record(z.string(), z.string())]).optional(),
	text: z.string().max(2000).optional(),
	filter: z.record(z.string(), z.union([filterValue, z.array(filterValue)])).optional(),
});

export const searchBodySchema = z.object({
	query: querySchema.extend({ text: z.string().min(1).max(2000) }),
	federation: z.enum(["auto", "referrals", "none"]).default("auto"),
	pageSize: z.number().int().min(1).max(100).optional(),
	pageToken: z.string().optional(),
});

export const exploreBodySchema = z.object({
	query: querySchema.optional(),
	resultType: z
		.object({
			facets: z
				.array(
					z.object({
						field: z.string().min(1),
						limit: z.number().int().min(1).max(200).optional(),
						minCount: z.number().int().min(1).optional(),
					}),
				)
				.min(1),
		})
		.optional(),
});

export function queryContext(
	query: z.infer<typeof querySchema> | undefined,
): Record<string, string> {
	const ctx = query?.["@context"];
	return ctx && typeof ctx === "object" ? ctx : {};
}

export function queryFilter(query: z.infer<typeof querySchema> | undefined): Filter {
	return normalizeFilter(query?.filter);
}

/** `GET /agents?filter=ofa:country=FR,ES;type=application/mcp-server-card+json`. `=` separates key and values because keys carry colons; `key:value` is accepted when the key has none. */
export function parseListFilter(raw: string | null): Filter {
	if (!raw) return {};
	const out: Filter = {};
	for (const clause of raw.split(";")) {
		const eq = clause.indexOf("=");
		const idx = eq >= 0 ? eq : clause.indexOf(":");
		if (idx <= 0) continue;
		const key = clause.slice(0, idx).trim();
		const values = clause
			.slice(idx + 1)
			.split(",")
			.map((v) => v.trim())
			.filter(Boolean);
		if (key && values.length) out[key] = values;
	}
	return out;
}
