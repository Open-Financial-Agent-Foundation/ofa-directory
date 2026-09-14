import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

export const DOC_PAGES = [
	{ slug: "index", title: "Overview" },
	{ slug: "connect", title: "Connect an agent" },
	{ slug: "mcp", title: "MCP server" },
	{ slug: "rest-api", title: "REST API" },
	{ slug: "publish", title: "Publish your catalog" },
	{ slug: "vocabulary", title: "The fc: vocabulary" },
	{ slug: "governance", title: "Governance" },
] as const;

export type DocSlug = (typeof DOC_PAGES)[number]["slug"];

export function isDocSlug(slug: string): slug is DocSlug {
	return DOC_PAGES.some((p) => p.slug === slug);
}

export async function renderDoc(
	slug: DocSlug,
	vars: Record<string, string>,
): Promise<{ title: string; html: string }> {
	let md = readFileSync(join(process.cwd(), "docs", `${slug}.md`), "utf8");
	for (const [k, v] of Object.entries(vars)) md = md.replaceAll(`{{${k}}}`, v);
	const page = DOC_PAGES.find((p) => p.slug === slug);
	const html = await marked.parse(md, { gfm: true, async: true });
	return { title: page?.title ?? slug, html };
}
