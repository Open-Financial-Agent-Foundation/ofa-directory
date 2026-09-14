import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	type ConformanceWarning,
	catalogSchema,
	type EntryOrigin,
	type IndexedEntry,
	parseUrn,
} from "./types";

const REGISTRY_ROOT = join(process.cwd(), "registry");

const ORIGIN_DIRS: Record<EntryOrigin, string> = {
	publisher: "publishers",
	crawled: "crawled",
	listing: "listings",
};

export type LoadedRegistry = {
	entries: IndexedEntry[];
	byIdentifier: Map<string, IndexedEntry>;
	warnings: ConformanceWarning[];
	errors: string[];
};

function listJsonFiles(dir: string): string[] {
	try {
		return readdirSync(dir)
			.filter((f) => f.endsWith(".json"))
			.sort()
			.map((f) => join(dir, f));
	} catch {
		return [];
	}
}

/** Reads every catalog file under `registry/`, validates it, and flattens it into one index. */
export function loadRegistry(root: string = REGISTRY_ROOT): LoadedRegistry {
	const entries: IndexedEntry[] = [];
	const byIdentifier = new Map<string, IndexedEntry>();
	const warnings: ConformanceWarning[] = [];
	const errors: string[] = [];

	for (const origin of Object.keys(ORIGIN_DIRS) as EntryOrigin[]) {
		for (const file of listJsonFiles(join(root, ORIGIN_DIRS[origin]))) {
			const rel = file.slice(root.length + 1);
			let raw: unknown;
			try {
				raw = JSON.parse(readFileSync(file, "utf8"));
			} catch (error) {
				errors.push(
					`${rel}: invalid JSON (${error instanceof Error ? error.message : String(error)})`,
				);
				continue;
			}
			const parsed = catalogSchema.safeParse(raw);
			if (!parsed.success) {
				errors.push(
					`${rel}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
				);
				continue;
			}
			for (const entry of parsed.data.entries) {
				const urn = parseUrn(entry.identifier);
				if (!urn) {
					errors.push(`${rel}: ${entry.identifier} is not a urn:air identifier`);
					continue;
				}
				if (byIdentifier.has(entry.identifier)) {
					errors.push(`${rel}: duplicate identifier ${entry.identifier}`);
					continue;
				}
				const queries = entry.representativeQueries ?? [];
				if (queries.length < 2 || queries.length > 5) {
					warnings.push({
						identifier: entry.identifier,
						message: `representativeQueries should hold 2 to 5 examples (has ${queries.length}); the entry is a catalog entry, not yet an ARD entry`,
					});
				}
				const indexed: IndexedEntry = {
					entry,
					host: parsed.data.host,
					publisher: urn.publisher,
					origin,
					sourceFile: rel,
				};
				entries.push(indexed);
				byIdentifier.set(entry.identifier, indexed);
			}
		}
	}

	return { entries, byIdentifier, warnings, errors };
}

let cached: LoadedRegistry | null = null;

/** Process-wide registry. The files are read once per server process; a deploy is what refreshes them. */
export function getRegistry(): LoadedRegistry {
	if (!cached) cached = loadRegistry();
	return cached;
}
