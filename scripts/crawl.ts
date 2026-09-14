/**
 * Crawls every domain in registry/sources.json for its `/.well-known/ai-catalog.json` (ARD §5.1),
 * validates it, and writes it under registry/crawled/<domain>.json. A failed fetch keeps the
 * previous file; the run reports it and exits non-zero so a scheduled job can alert.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { catalogSchema } from "../src/lib/registry/types";

const MAX_BYTES = 5 * 1024 * 1024;
const sources: string[] = JSON.parse(readFileSync("registry/sources.json", "utf8")).domains;
let failures = 0;

for (const domain of sources) {
	const url = `https://${domain}/.well-known/ai-catalog.json`;
	try {
		const res = await fetch(url, {
			redirect: "error",
			signal: AbortSignal.timeout(15000),
			headers: { accept: "application/json" },
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const text = await res.text();
		if (text.length > MAX_BYTES) throw new Error("catalog larger than 5 MB");
		const parsed = catalogSchema.safeParse(JSON.parse(text));
		if (!parsed.success)
			throw new Error(
				parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
			);
		const foreign = parsed.data.entries.filter(
			(e) => !e.identifier.toLowerCase().startsWith(`urn:air:${domain.toLowerCase()}:`),
		);
		if (foreign.length)
			throw new Error(
				`${foreign.length} entries claim a publisher other than ${domain} (ARD §4.5.1)`,
			);
		writeFileSync(`registry/crawled/${domain}.json`, `${JSON.stringify(parsed.data, null, 2)}\n`);
		console.log(`ok    ${domain}: ${parsed.data.entries.length} entries`);
	} catch (error) {
		failures += 1;
		console.error(`fail  ${domain}: ${error instanceof Error ? error.message : String(error)}`);
	}
}
if (failures) process.exit(1);
