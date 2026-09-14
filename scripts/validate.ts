/** CI gate: every file under registry/ must parse, validate, and carry unique identifiers. */
import { loadRegistry } from "../src/lib/registry/load";

const { entries, warnings, errors } = loadRegistry();
for (const w of warnings) console.warn(`warn  ${w.identifier}: ${w.message}`);
for (const e of errors) console.error(`error ${e}`);
const byOrigin: Record<string, number> = {};
for (const e of entries) byOrigin[e.origin] = (byOrigin[e.origin] ?? 0) + 1;
const breakdown = Object.entries(byOrigin)
	.map(([k, v]) => `${k}: ${v}`)
	.join(", ");
console.log(
	`${entries.length} entries (${breakdown}), ${warnings.length} warnings, ${errors.length} errors`,
);
if (errors.length) process.exit(1);
