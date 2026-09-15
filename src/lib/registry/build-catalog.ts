import { z } from "zod";
import { FC_ACTIONS, FC_ROLES, FC_SECTORS } from "./types";

/** Everything a publisher states about themselves. What the endpoint states is read separately and never sent by the client. */
export const submissionSchema = z.object({
	url: z.string().min(8).max(2048),
	publisher: z
		.string()
		.min(3)
		.max(253)
		.regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "a domain name, lowercase, no scheme and no path"),
	displayName: z.string().min(1).max(120),
	description: z.string().min(10).max(600),
	sector: z.enum(FC_SECTORS),
	lineOfBusiness: z.array(z.string().min(1).max(60)).min(1).max(12),
	role: z.enum(FC_ROLES).optional(),
	actions: z.array(z.enum(FC_ACTIONS)).min(1),
	country: z
		.array(z.string().regex(/^[A-Za-z]{2}$/))
		.max(60)
		.default([]),
	languages: z
		.array(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/))
		.max(20)
		.default([]),
	representativeQueries: z.array(z.string().min(3).max(200)).min(2).max(5),
});

export type Submission = z.infer<typeof submissionSchema>;

/** What the endpoint itself said, read server-side. A client never supplies these. */
export type VerifiedFacts = {
	endpointHost: string;
	slug: string;
	capabilities: string[];
	version?: string;
};

/**
 * The one place a catalog document is composed, so the file a publisher previews and the file the
 * pull request carries cannot drift apart.
 */
export function buildCatalog(input: {
	submission: Submission;
	facts: VerifiedFacts;
	checkedAt: string;
}): string {
	const { submission, facts } = input;
	const hostedElsewhere = facts.endpointHost !== submission.publisher;

	const entry: Record<string, unknown> = {
		identifier: `urn:air:${submission.publisher}:agent:${facts.slug}`,
		displayName: submission.displayName.trim(),
		type: "application/mcp-server-card+json",
		url: submission.url,
		description: submission.description.trim(),
		capabilities: facts.capabilities,
		representativeQueries: submission.representativeQueries,
		...(facts.version ? { version: facts.version } : {}),
		"ofa:sector": [submission.sector],
		"ofa:lineOfBusiness": submission.lineOfBusiness.map((v) => v.trim().toLowerCase()),
		...(submission.role ? { "ofa:role": [submission.role] } : {}),
		"ofa:actions": submission.actions,
		...(submission.country.length
			? { "ofa:country": submission.country.map((c) => c.toUpperCase()) }
			: {}),
		...(submission.languages.length ? { "ofa:languages": submission.languages } : {}),
		...(hostedElsewhere ? { "ofa:hostedBy": facts.endpointHost } : {}),
		"ofa:status": "live",
		metadata: { transport: "streamable-http", checkedAt: input.checkedAt },
	};

	return `${JSON.stringify(
		{
			specVersion: "1.0",
			"@context": { ofa: "https://openfinancialagent.org/ns#" },
			host: { displayName: submission.displayName.trim(), identifier: submission.publisher },
			entries: [entry],
		},
		null,
		2,
	)}\n`;
}

export function catalogPath(publisher: string): string {
	return `registry/publishers/${publisher}.json`;
}
