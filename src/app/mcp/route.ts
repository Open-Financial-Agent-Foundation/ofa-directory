import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { buildContext } from "@/lib/registry/context";
import { DEFAULT_FACETS, explore } from "@/lib/registry/explore";
import { getRegistry } from "@/lib/registry/load";
import { normalizeFilter, search } from "@/lib/registry/search";
import { apiBase, SITE, siteUrl } from "@/lib/site";

export const maxDuration = 60;

const filterInput = z
	.record(z.string(), z.union([z.string(), z.array(z.string())]))
	.optional()
	.describe(
		'Structured constraints, AND across keys, OR within a key. Keys: fc:sector, fc:lineOfBusiness, fc:country (ISO alpha-2), fc:actions, fc:role, fc:status, fc:languages, type, tags, capabilities, publisher. Example: {"fc:country":["ES"],"fc:actions":"quote"}',
	);

const INSTRUCTIONS = `${SITE.name} is an open registry of financial-services agents, MCP servers and APIs (insurance, banking, lending, payments, wealth, public finance). It conforms to Agentic Resource Discovery (ARD).
Use \`search\` to find providers for a task, \`explore\` to see what exists (facets), \`get_entry\` for the full record, and \`context\` when the user has a factual question a provider can answer from its own knowledge: it asks the matching providers' MCP servers and returns their answers with sources. Scores are relevance only, never trust. To act (quote, apply), connect to the provider's own \`url\`.`;

function buildServer(request: Request): McpServer {
	const server = new McpServer(
		{ name: "fincommons", title: SITE.name, version: "0.1.0" },
		{ capabilities: {}, instructions: INSTRUCTIONS },
	);

	server.registerTool(
		"search",
		{
			title: "Search the financial services index",
			description:
				"Rank indexed financial-services agents, MCP servers and listings against a natural-language need. Returns ARD entries with a 0-100 relevance score. Use filters for country, sector, line of business or action.",
			inputSchema: {
				query: z
					.string()
					.min(1)
					.max(2000)
					.describe("The user's need in their own words, e.g. 'insure my dog in Sweden'."),
				filter: filterInput,
				pageSize: z.number().int().min(1).max(50).optional(),
				pageToken: z.string().optional(),
			},
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ query, filter, pageSize, pageToken }) => {
			const result = search({
				entries: getRegistry().entries,
				text: query,
				filter: normalizeFilter(filter),
				pageSize: pageSize ?? 10,
				pageToken,
				source: apiBase(request),
			});
			const payload = {
				results: result.results.map((r) => ({
					...r.entry,
					publisher: r.publisher,
					score: r.score,
					source: r.source,
				})),
				...(result.pageToken ? { pageToken: result.pageToken } : {}),
				total: result.total,
			};
			const lines = payload.results.map(
				(r) =>
					`- ${r.displayName} (${r.publisher}) · score ${r.score} · ${r.type}\n  ${r.identifier}\n  ${r.url ?? ""}\n  ${r.description ?? ""}`,
			);
			return {
				content: [
					{
						type: "text",
						text: lines.length ? `${payload.total} match(es)\n\n${lines.join("\n")}` : "No match.",
					},
				],
				structuredContent: payload,
			};
		},
	);

	server.registerTool(
		"explore",
		{
			title: "Explore the index by facets",
			description:
				"Facet counts over the matched set (sector, line of business, country, type, publisher, actions, status). Call with no arguments to see the whole index.",
			inputSchema: {
				query: z.string().max(2000).optional(),
				filter: filterInput,
				facets: z
					.array(z.string())
					.optional()
					.describe(
						`Term paths to aggregate. Default: ${DEFAULT_FACETS.map((f) => f.field).join(", ")}`,
					),
			},
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ query, filter, facets }) => {
			const result = explore({
				entries: getRegistry().entries,
				text: query,
				filter: normalizeFilter(filter),
				facets: facets?.map((field) => ({ field })),
			});
			const text = Object.entries(result.facets)
				.map(
					([field, f]) => `${field}: ${f.buckets.map((b) => `${b.value} (${b.count})`).join(", ")}`,
				)
				.join("\n");
			return {
				content: [{ type: "text", text: `${result.matched} entries\n${text}` }],
				structuredContent: result,
			};
		},
	);

	server.registerTool(
		"get_entry",
		{
			title: "Get one entry",
			description:
				"The complete ARD entry for an identifier (urn:air:...), including representative queries, capabilities and the FinCommons vocabulary terms.",
			inputSchema: { identifier: z.string().regex(/^urn:air:/) },
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ identifier }) => {
			const hit = getRegistry().byIdentifier.get(identifier);
			if (!hit)
				return { content: [{ type: "text", text: `No entry ${identifier}` }], isError: true };
			const payload = { ...hit.entry, publisher: hit.publisher, host: hit.host };
			return {
				content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
				structuredContent: payload,
			};
		},
	);

	server.registerTool(
		"context",
		{
			title: "Ask the providers that can answer",
			description:
				"For a factual question (coverage, conditions, eligibility, pricing rules), find the providers whose MCP servers can answer it, ask each one through its own knowledge tool, and return their answers with the source. Slower than search (it calls other servers). Never use it to start a quote or an application.",
			inputSchema: {
				query: z.string().min(3).max(2000),
				filter: filterInput,
				maxSources: z
					.number()
					.int()
					.min(1)
					.max(5)
					.optional()
					.describe("Providers to ask, default 3."),
			},
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ query, filter, maxSources }) => {
			const result = await buildContext({
				entries: getRegistry().entries,
				question: query,
				filter: normalizeFilter(filter),
				maxSources,
			});
			return {
				content: [{ type: "text", text: result.markdown }],
				structuredContent: { sources: result.sources, considered: result.considered },
			};
		},
	);

	return server;
}

export async function POST(request: Request) {
	const server = buildServer(request);
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
	await server.connect(transport);
	return transport.handleRequest(request);
}

/** Stateless server: no SSE stream to resume, so GET explains how to connect instead. */
export async function GET(request: Request) {
	return Response.json(
		{
			name: SITE.name,
			transport: "streamable-http",
			stateless: true,
			endpoint: `${siteUrl(request)}/mcp`,
			tools: ["search", "explore", "get_entry", "context"],
			docs: `${siteUrl(request)}/docs/mcp`,
		},
		{ status: 405, headers: { allow: "POST, OPTIONS" } },
	);
}

export async function DELETE() {
	return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS" } });
}

export async function OPTIONS() {
	return new Response(null, { status: 204 });
}
