import { NextResponse } from "next/server";
import { getRegistry } from "@/lib/registry/load";
import { SITE, siteUrl } from "@/lib/site";

/**
 * Open Financial Agent's own catalog (ARD §5.1). It advertises the registry API and the MCP wrapper so
 * other registries can federate to it, and lists the publishers it indexes as nested catalogs.
 */
export async function GET(request: Request) {
	const base = siteUrl(request);
	const host = new URL(base).host;
	const registry = getRegistry();
	const publishers = [
		...new Set(registry.entries.filter((e) => e.origin === "publisher").map((e) => e.publisher)),
	].sort();
	return NextResponse.json(
		{
			"@context": [
				"https://agenticresourcediscovery.org/context/v1",
				{ ofa: "https://openfinancialagent.org/ns#" },
			],
			specVersion: "1.0",
			host: {
				displayName: SITE.name,
				identifier: host,
				documentationUrl: `${base}/docs`,
				trustManifest: { identity: base, identityType: "https" },
			},
			entries: [
				{
					identifier: `urn:air:${host}:registry:financial-services`,
					displayName: "Open Financial Agent registry",
					type: "application/ai-registry+json",
					url: `${base}/api/v1`,
					description:
						"Open, ARD-conformant registry of financial-services agents, MCP servers and APIs: insurance, banking, lending, payments, wealth.",
					tags: ["registry", "financial-services", "insurance", "banking"],
					capabilities: ["search", "explore", "agents"],
					representativeQueries: [
						"find an insurer that quotes home insurance in Spain",
						"which banks expose an MCP server for personal loans",
						"pet insurance agents in Sweden",
					],
				},
				{
					identifier: `urn:air:${host}:server:mcp`,
					displayName: "Open Financial Agent MCP",
					type: "application/mcp-server-card+json",
					url: `${base}/mcp`,
					description:
						"MCP wrapper over the registry (ARD §5.3.5): search, explore, get_entry, and context, which fans a question out to the matching providers' own MCP servers.",
					capabilities: ["search", "explore", "get_entry", "context"],
					representativeQueries: [
						"search the financial services index",
						"ask the insurers that can answer this",
					],
				},
				...publishers.map((p) => ({
					identifier: `urn:air:${host}:catalog:${p.replace(/[^a-z0-9.-]/gi, "-")}`,
					displayName: `Indexed catalog: ${p}`,
					type: "application/ai-catalog+json",
					url: `${base}/api/v1/agents?filter=publisher=${encodeURIComponent(p)}`,
				})),
			],
		},
		{
			headers: {
				"content-type": "application/json",
				"cache-control": "public, max-age=300, s-maxage=3600",
			},
		},
	);
}
