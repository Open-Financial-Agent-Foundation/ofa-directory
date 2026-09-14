import { getRegistry } from "@/lib/registry/load";
import { SITE, siteUrl } from "@/lib/site";

export async function GET(request: Request) {
	const base = siteUrl(request);
	const { entries } = getRegistry();
	const live = entries.filter((e) => e.origin === "publisher");
	const lines = [
		`# ${SITE.name}`,
		"",
		`> ${SITE.tagline} An open registry conforming to Agentic Resource Discovery (${SITE.specVersion}). Apache-2.0.`,
		"",
		"## Connect",
		`- MCP (Streamable HTTP, no auth): ${base}/mcp`,
		`- REST: POST ${base}/api/v1/search, POST ${base}/api/v1/explore, GET ${base}/api/v1/agents, GET ${base}/api/v1/entries/{identifier}`,
		`- Catalog: ${base}/.well-known/ai-catalog.json`,
		"",
		"## Docs",
		...["index", "connect", "mcp", "rest-api", "publish", "vocabulary", "governance"].map(
			(s) => `- ${base}/docs/${s}`,
		),
		"",
		`## Indexed providers with a live endpoint (${live.length})`,
		...live.map(
			(e) =>
				`- ${e.entry.displayName} (${e.publisher}): ${e.entry.url} — ${e.entry.description ?? ""}`,
		),
		"",
	];
	return new Response(lines.join("\n"), {
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"cache-control": "public, max-age=300",
		},
	});
}
