import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { CopyCommand } from "@/components/copy-command";
import { type Row, rowFromApi } from "@/components/entry-row";
import { type Demo, HeroSearch } from "@/components/hero-search";
import { type Facet, IndexExplorer } from "@/components/index-explorer";
import { explore } from "@/lib/registry/explore";
import { getRegistry } from "@/lib/registry/load";
import { search } from "@/lib/registry/search";
import type { IndexedEntry } from "@/lib/registry/types";
import { apiBase, SITE, siteUrl } from "@/lib/site";

/** Real needs, in the languages the indexed providers speak. Ranked at request time, so the demo never lies. */
const DEMO_QUERIES = [
	"insurance quote for my pet and my home",
	"devis assurance auto jeune conducteur",
	"home insurance quote in Spain",
	"insurance for my family: health, home, travel",
];

/** Near-misses read as noise in a four-line answer; the live search still shows them. */
const DEMO_FLOOR = 20;

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

const STEPS = [
	{
		title: "Publish",
		body: "A provider describes its agent in ai-catalog.json: what it does, the queries it answers, its endpoint. Hosted on its own domain or sent as a pull request.",
		href: "/docs/publish",
		link: "How to publish",
	},
	{
		title: "Index",
		body: "The registry validates the file against the ARD schema, binds every entry to its publisher's domain and ranks it against needs in plain language.",
		href: "/docs/vocabulary",
		link: "The vocabulary",
	},
	{
		title: "Connect",
		body: "An agent asks in one call, gets the provider's address, and talks to it directly. The registry never quotes, never binds, never holds customer data.",
		href: "/docs/connect",
		link: "Connect an agent",
	},
];

export default function Home() {
	const registry = getRegistry();
	const demos: Demo[] = DEMO_QUERIES.map((query) => ({
		query,
		rows: search({
			entries: registry.entries,
			text: query,
			pageSize: 4,
			source: apiBase(),
		})
			.results.filter((r) => r.score >= DEMO_FLOOR)
			.map((r) => rowFromApi({ ...r.entry, publisher: r.publisher, score: r.score })),
	})).filter((d) => d.rows.length > 0);

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
	const command = `claude mcp add --transport http ofa ${siteUrl()}/mcp`;

	return (
		<div className="pt-16 sm:pt-20 pb-8">
			<section className="max-w-[760px]">
				<h1 className="text-[40px] sm:text-[52px] leading-[1.06] text-ink max-w-[24ch]">
					{SITE.tagline}
				</h1>
				<p className="mt-5 text-[18px] leading-[1.55] text-muted max-w-[56ch]">
					Insurers, banks and lenders publish what their agents can do, and any agent asks here
					before connecting to the provider directly.
				</p>
			</section>

			<div className="mt-12">
				<HeroSearch demos={demos} total={registry.entries.length} />
			</div>

			<section aria-labelledby="how" className="mt-36 max-w-[1120px]">
				<h2 id="how" className="text-[22px]">
					How it works
				</h2>
				<ol className="mt-6 border-t border-rule">
					{STEPS.map((s) => (
						<li
							key={s.title}
							className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-x-10 gap-y-2 py-6 border-b border-rule"
						>
							<h3 className="text-[17px] leading-7">{s.title}</h3>
							<p className="text-[15.5px] text-muted max-w-[62ch] leading-relaxed">{s.body}</p>
							<Link
								href={s.href}
								className="inline-flex items-center text-[14px] text-muted hover:text-ink transition-colors duration-150 sm:pt-1 whitespace-nowrap"
							>
								{s.link}
								<ArrowIcon className="inline-block ml-1 -mt-px" />
							</Link>
						</li>
					))}
				</ol>
			</section>

			<section aria-labelledby="connect" className="mt-32 max-w-[760px]">
				<h2 id="connect" className="text-[22px]">
					Connect in one line
				</h2>
				<p className="mt-3 text-[15.5px] text-muted max-w-[58ch] leading-relaxed">
					A stateless MCP server, no key. Tools: search, explore, get_entry and context, which asks
					the matching providers' own knowledge tools and returns their answers with sources.
				</p>
				<div className="mt-6">
					<CopyCommand command={command} />
				</div>
				<p className="mt-3 text-[13.5px] text-faint">
					Cursor, VS Code, ChatGPT and Claude.ai connectors take the same URL.{" "}
					<Link
						href="/docs/mcp"
						className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink transition-colors"
					>
						MCP reference
					</Link>
					{" · "}
					<Link
						href="/docs/rest-api"
						className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink transition-colors"
					>
						REST API
					</Link>
				</p>
			</section>

			<div className="mt-32">
				<IndexExplorer
					initial={ordered.map(toRow)}
					facets={facets}
					total={registry.entries.length}
				/>
			</div>
		</div>
	);
}
