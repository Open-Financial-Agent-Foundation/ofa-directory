import { type Facet, IndexExplorer, type Row } from "@/components/index-explorer";
import { explore } from "@/lib/registry/explore";
import { getRegistry } from "@/lib/registry/load";
import type { IndexedEntry } from "@/lib/registry/types";
import { SITE, siteUrl } from "@/lib/site";

const FACETS: { field: string; label: string }[] = [
	{ field: "ofa:sector", label: "Sector" },
	{ field: "ofa:lineOfBusiness", label: "Line of business" },
	{ field: "ofa:country", label: "Country" },
	{ field: "ofa:actions", label: "Actions" },
	{ field: "ofa:status", label: "Status" },
];

function toRow(e: IndexedEntry): Row {
	const x = e.entry;
	return {
		identifier: x.identifier,
		displayName: x.displayName,
		description: x.description ?? null,
		type: x.type,
		url: x.url ?? null,
		publisher: e.publisher,
		capabilities: x.capabilities ?? [],
		sector: x["ofa:sector"] ?? [],
		lineOfBusiness: x["ofa:lineOfBusiness"] ?? [],
		country: x["ofa:country"] ?? [],
		actions: x["ofa:actions"] ?? [],
		status: x["ofa:status"] ?? null,
		score: null,
	};
}

export default function Home() {
	const registry = getRegistry();
	const ordered = [...registry.entries].sort((a, b) => {
		const rank = (e: IndexedEntry) =>
			e.origin === "publisher" ? 0 : e.origin === "crawled" ? 1 : 2;
		return rank(a) - rank(b) || a.entry.displayName.localeCompare(b.entry.displayName);
	});
	const facetResult = explore({
		entries: registry.entries,
		facets: FACETS.map((f) => ({ field: f.field, limit: 12 })),
	});
	const facets: Facet[] = FACETS.map((f) => ({
		...f,
		buckets: facetResult.facets[f.field]?.buckets ?? [],
	}));
	const live = registry.entries.filter((e) => e.entry["ofa:status"] === "live").length;
	const publishers = new Set(registry.entries.map((e) => e.publisher)).size;
	const countries = new Set(registry.entries.flatMap((e) => e.entry["ofa:country"] ?? [])).size;

	return (
		<div className="py-12 sm:py-16">
			<section className="max-w-[720px]">
				<h1 className="text-[36px] sm:text-[48px] font-semibold text-ink">{SITE.tagline}</h1>
				<p className="mt-5 text-[17px] text-muted max-w-[60ch]">
					Insurers, banks, lenders and public financiers publish what their agents can do. Personal
					agents ask one place who can quote, compare, explain or apply, then connect to the
					provider directly. Conforms to Agentic Resource Discovery, open under Apache-2.0.
				</p>
				<dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-rule pt-5">
					{[
						{ k: "Entries", v: registry.entries.length },
						{ k: "Live endpoints", v: live },
						{ k: "Publishers", v: publishers },
						{ k: "Countries", v: countries },
					].map((s) => (
						<div key={s.k}>
							<dt className="label">{s.k}</dt>
							<dd className="mono text-[26px] leading-none mt-1.5 text-ink">{s.v}</dd>
						</div>
					))}
				</dl>
				<pre className="mt-6 mono text-[12.5px] text-ink bg-code rounded-xl px-4 py-3 overflow-x-auto">
					<code>{`claude mcp add --transport http ofa ${siteUrl()}/mcp`}</code>
				</pre>
			</section>

			<div className="mt-14">
				<IndexExplorer
					initial={ordered.map(toRow)}
					facets={facets}
					total={registry.entries.length}
				/>
			</div>
		</div>
	);
}
