/**
 * Turns an export of public app-directory listings (ChatGPT apps, Claude connectors) into
 * catalog entries under `registry/listings/`. A listing has no endpoint of its own, so it is
 * published as `text/html` pointing at the directory page, with `fc:status: "listing"`.
 *
 * Usage: bun run scripts/import-directories.ts <export.json>
 * Rows: { source, name, category, appUrl, oneLiner, description, logoUrl, countries, capabilities, firstSeenAt }.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";

const rowSchema = z.object({
	source: z.enum(["chatgpt-apps", "claude-connectors"]),
	name: z.string().min(1),
	category: z.string().nullable(),
	appUrl: z.url(),
	oneLiner: z.string().nullable(),
	description: z.string().nullable(),
	logoUrl: z.string().nullable(),
	countries: z.array(z.string()).nullable(),
	capabilities: z.array(z.string()).nullable(),
	firstSeenAt: z.string().nullable(),
});

const INSURANCE =
	/\binsur\w*|reinsur|underwrit|policyholder|\bsegur|asegur|verzeker|versicher|assicur|\bassurance\b|takaful|decesos|mutuelle/i;

const PLATFORM = {
	"chatgpt-apps": {
		publisher: "chatgpt.com",
		namespace: "app",
		host: "ChatGPT app directory",
		platform: "chatgpt",
	},
	"claude-connectors": {
		publisher: "claude.com",
		namespace: "connector",
		host: "Claude connectors directory",
		platform: "claude",
	},
} as const;

function slugify(s: string): string {
	return s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
}

const file = process.argv[2];
if (!file) throw new Error("usage: import-directories.ts <export.json>");
const rows = z.array(rowSchema).parse(JSON.parse(readFileSync(file, "utf8")));

for (const source of Object.keys(PLATFORM) as (keyof typeof PLATFORM)[]) {
	const meta = PLATFORM[source];
	const seen = new Set<string>();
	const entries = rows
		.filter((r) => r.source === source)
		.sort((a, b) => a.name.localeCompare(b.name))
		.flatMap((r) => {
			let slug = slugify(r.name);
			if (!slug) return [];
			while (seen.has(slug)) slug = `${slug}-2`;
			seen.add(slug);
			const isInsurance = INSURANCE.test(`${r.name} ${r.oneLiner ?? ""} ${r.description ?? ""}`);
			const countries = (r.countries ?? []).filter((c) => /^[A-Z]{2}$/.test(c));
			const description = [r.oneLiner, r.description]
				.filter((s): s is string => Boolean(s))
				.join(" ")
				.slice(0, 600);
			return [
				{
					identifier: `urn:air:${meta.publisher}:${meta.namespace}:${slug}`,
					displayName: r.name,
					type: "text/html",
					url: r.appUrl,
					...(description ? { description } : {}),
					tags: [
						"directory-listing",
						meta.platform,
						...(r.category ? [slugify(r.category)] : []),
						isInsurance ? "insurance" : "financial-services",
					],
					...(isInsurance ? { "fc:sector": ["insurance"] } : {}),
					...(countries.length ? { "fc:country": countries } : {}),
					"fc:status": "listing",
					metadata: {
						platform: meta.platform,
						directoryCategory: r.category,
						directoryCapabilities: r.capabilities ?? [],
						logoUrl: r.logoUrl,
						firstSeenAt: r.firstSeenAt,
						importedAt: new Date().toISOString().slice(0, 10),
					},
				},
			];
		});
	const out = `registry/listings/${source}.json`;
	writeFileSync(
		out,
		`${JSON.stringify({ specVersion: "1.0", "@context": { fc: "https://fincommons.org/ns#" }, host: { displayName: meta.host, identifier: meta.publisher }, entries }, null, 2)}\n`,
	);
	console.log(`${out}: ${entries.length} listings`);
}
