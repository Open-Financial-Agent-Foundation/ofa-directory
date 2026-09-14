import { z } from "zod";

/** IANA media types ARD registries see most. Any other media type is accepted as-is. */
export const KNOWN_TYPES = {
	mcpServer: "application/mcp-server-card+json",
	a2aAgent: "application/a2a-agent-card+json",
	openapiJson: "application/openapi+json",
	openapiYaml: "application/openapi+yaml",
	skill: "application/ai-skill+md",
	registry: "application/ai-registry+json",
	catalog: "application/ai-catalog+json",
	html: "text/html",
} as const;

/** The FinCommons vocabulary. Every term here is a filter dimension on `/search` and `/explore`. */
export const FC_NAMESPACE = "https://fincommons.org/ns#";
export const FC_PREFIX = "fc";
export const ARD_NAMESPACE = "https://agenticresourcediscovery.org/ns#";
export const ARD_CONTEXT_URL = "https://agenticresourcediscovery.org/context/v1";

export const FC_SECTORS = [
	"insurance",
	"banking",
	"lending",
	"payments",
	"wealth",
	"pensions",
	"legal",
	"public-finance",
] as const;
export const FC_ROLES = [
	"carrier",
	"broker",
	"comparator",
	"mga",
	"bank",
	"fintech",
	"public-body",
	"service-provider",
] as const;
export const FC_ACTIONS = [
	"quote",
	"bind",
	"compare",
	"faq",
	"claim",
	"callback",
	"simulate",
	"apply",
	"search",
] as const;

export const fcTermsSchema = z.object({
	"fc:sector": z.array(z.enum(FC_SECTORS)).optional(),
	"fc:lineOfBusiness": z.array(z.string().min(1)).optional(),
	"fc:role": z.array(z.enum(FC_ROLES)).optional(),
	"fc:actions": z.array(z.enum(FC_ACTIONS)).optional(),
	"fc:country": z.array(z.string().regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2")).optional(),
	"fc:languages": z.array(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "BCP 47")).optional(),
	"fc:regulator": z.array(z.string().min(1)).optional(),
	"fc:hostedBy": z.string().min(1).optional(),
	"fc:status": z.enum(["live", "demo", "listing"]).optional(),
});

const contextSchema = z.union([
	z.string(),
	z.record(z.string(), z.unknown()),
	z.array(z.union([z.string(), z.record(z.string(), z.unknown())])),
]);

export const trustManifestSchema = z.looseObject({
	identity: z.string().min(1),
	identityType: z.enum(["spiffe", "did", "https"]).optional(),
	attestations: z
		.array(
			z.looseObject({
				type: z.string(),
				uri: z.string().optional(),
				digest: z.string().optional(),
			}),
		)
		.optional(),
	signature: z.string().optional(),
});

export const URN_PATTERN = /^urn:air:([a-z0-9.-]+\.[a-z]{2,}):([a-z0-9._-]+):([a-z0-9._-]+)$/i;

export const entrySchema = z
	.looseObject({
		"@context": contextSchema.optional(),
		"@id": z.string().optional(),
		identifier: z.string().regex(URN_PATTERN, "urn:air:<publisher-domain>:<namespace>:<name>"),
		displayName: z.string().min(1),
		type: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i, "IANA media type"),
		url: z.url().optional(),
		data: z.record(z.string(), z.unknown()).optional(),
		description: z.string().optional(),
		tags: z.array(z.string()).optional(),
		capabilities: z.array(z.string()).optional(),
		representativeQueries: z.array(z.string()).optional(),
		version: z.string().optional(),
		updatedAt: z.string().optional(),
		metadata: z.record(z.string(), z.unknown()).optional(),
		trustManifest: trustManifestSchema.optional(),
		...fcTermsSchema.shape,
	})
	.refine((e) => (e.url === undefined) !== (e.data === undefined), {
		message: "exactly one of `url` or `data` (ARD §4.3)",
	});

export const hostSchema = z.looseObject({
	displayName: z.string().min(1),
	identifier: z.string().optional(),
	documentationUrl: z.url().optional(),
	logoUrl: z.url().optional(),
	trustManifest: trustManifestSchema.optional(),
});

/** One `ai-catalog.json` document. Every file under `registry/` has this shape. */
export const catalogSchema = z.looseObject({
	"@context": contextSchema.optional(),
	specVersion: z.string(),
	host: hostSchema,
	entries: z.array(entrySchema),
});

export type Entry = z.infer<typeof entrySchema>;
export type Host = z.infer<typeof hostSchema>;
export type Catalog = z.infer<typeof catalogSchema>;

export type EntryOrigin = "publisher" | "crawled" | "listing";

/** An entry as the index holds it: the entry itself plus what the registry derived from it. */
export type IndexedEntry = {
	entry: Entry;
	host: Host;
	/** `<publisher>` segment of the URN (ARD Appendix C). */
	publisher: string;
	origin: EntryOrigin;
	sourceFile: string;
};

export type Filter = Record<string, string[]>;

export type SearchResult = {
	entry: Entry;
	publisher: string;
	score: number;
	source: string;
};

export type ConformanceWarning = { identifier: string; message: string };

export function parseUrn(
	identifier: string,
): { publisher: string; namespace: string; name: string } | null {
	const m = URN_PATTERN.exec(identifier);
	if (!m?.[1] || !m[2] || !m[3]) return null;
	return { publisher: m[1].toLowerCase(), namespace: m[2], name: m[3] };
}
