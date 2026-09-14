/** Re-vendors the ARD schemas from the upstream spec repository. */
import { writeFileSync } from "node:fs";

const BASE = "https://raw.githubusercontent.com/ards-project/ard-spec/main/spec/schemas/";
for (const f of [
	"ai-catalog.schema.json",
	"ard-entry.schema.json",
	"ard.openapi.yaml",
	"ard.context.jsonld",
	"ard.cddl",
]) {
	const res = await fetch(BASE + f);
	if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
	writeFileSync(`spec/ard/${f}`, await res.text());
	console.log(`synced ${f}`);
}
