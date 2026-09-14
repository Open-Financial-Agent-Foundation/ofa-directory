"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { StatusPill } from "./status-pill";
import { TypeMark } from "./type-mark";

export type Row = {
	identifier: string;
	displayName: string;
	description: string | null;
	type: string;
	url: string | null;
	publisher: string;
	capabilities: string[];
	sector: string[];
	lineOfBusiness: string[];
	country: string[];
	actions: string[];
	status: string | null;
	score: number | null;
};

export type Facet = { field: string; label: string; buckets: { value: string; count: number }[] };

const EXAMPLES = [
	"home insurance quote in Spain",
	"insure my dog",
	"RC Pro auto-entrepreneur",
	"personal loan simulation",
	"travel insurance for Japan",
	"financement création d'entreprise",
];

function toRow(r: Record<string, unknown>): Row {
	const arr = (v: unknown): string[] =>
		Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
	const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
	return {
		identifier: str(r.identifier) ?? "",
		displayName: str(r.displayName) ?? "",
		description: str(r.description),
		type: str(r.type) ?? "",
		url: str(r.url),
		publisher: str(r.publisher) ?? "",
		capabilities: arr(r.capabilities),
		sector: arr(r["ofa:sector"]),
		lineOfBusiness: arr(r["ofa:lineOfBusiness"]),
		country: arr(r["ofa:country"]),
		actions: arr(r["ofa:actions"]),
		status: str(r["ofa:status"]),
		score: typeof r.score === "number" ? r.score : null,
	};
}

export function IndexExplorer({
	initial,
	facets,
	total,
}: {
	initial: Row[];
	facets: Facet[];
	total: number;
}) {
	const [query, setQuery] = useState("");
	const [active, setActive] = useState<Record<string, string>>({});
	const [rows, setRows] = useState<Row[]>(initial);
	const [count, setCount] = useState(total);
	const [busy, setBusy] = useState(false);
	const inputId = useId();
	const abort = useRef<AbortController | null>(null);

	useEffect(() => {
		const text = query.trim();
		const filter = Object.fromEntries(Object.entries(active).map(([k, v]) => [k, [v]]));
		if (!text && Object.keys(filter).length === 0) {
			setRows(initial);
			setCount(total);
			return;
		}
		abort.current?.abort();
		const ctl = new AbortController();
		abort.current = ctl;
		const t = setTimeout(async () => {
			setBusy(true);
			try {
				const res = text
					? await fetch("/api/v1/search", {
							method: "POST",
							headers: { "content-type": "application/json" },
							body: JSON.stringify({ query: { text, filter }, pageSize: 50 }),
							signal: ctl.signal,
						})
					: await fetch(
							`/api/v1/agents?pageSize=100&filter=${encodeURIComponent(
								Object.entries(filter)
									.map(([k, v]) => `${k}=${v.join(",")}`)
									.join(";"),
							)}`,
							{ signal: ctl.signal },
						);
				const body: unknown = await res.json();
				if (body && typeof body === "object") {
					const list =
						"results" in body && Array.isArray(body.results)
							? body.results
							: "agents" in body && Array.isArray(body.agents)
								? body.agents
								: [];
					setRows(
						list
							.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
							.map(toRow),
					);
					setCount("total" in body && typeof body.total === "number" ? body.total : list.length);
				}
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError"))
					console.error("[ofa] search failed", { error });
			} finally {
				if (!ctl.signal.aborted) setBusy(false);
			}
		}, 160);
		return () => clearTimeout(t);
	}, [query, active, initial, total]);

	const toggle = (field: string, value: string) =>
		setActive((prev) => {
			const next = { ...prev };
			if (next[field] === value) delete next[field];
			else next[field] = value;
			return next;
		});

	return (
		<section aria-labelledby={`${inputId}-label`}>
			<label id={`${inputId}-label`} htmlFor={inputId} className="label block mb-2">
				Search the index
			</label>
			<div className="relative">
				<input
					id={inputId}
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="what does the user need? e.g. insure a flat in Madrid"
					autoComplete="off"
					className="w-full bg-panel border border-rule-strong rounded-[4px] px-4 py-3.5 text-[17px] placeholder:text-muted/70 focus:border-accent outline-none transition-colors"
				/>
				<span
					className="absolute right-4 top-1/2 -translate-y-1/2 mono text-[12px] text-muted"
					aria-live="polite"
				>
					{busy ? "searching…" : `${count} ${count === 1 ? "entry" : "entries"}`}
				</span>
			</div>
			<div className="flex flex-wrap gap-2 mt-3">
				{EXAMPLES.map((ex) => (
					<button
						key={ex}
						type="button"
						onClick={() => setQuery(ex)}
						className="mono text-[12px] text-muted hover:text-ink border border-rule hover:border-rule-strong rounded-full px-2.5 py-1 transition-colors"
					>
						{ex}
					</button>
				))}
			</div>

			<div className="mt-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
				<aside className="flex flex-col gap-6">
					{facets.map((f) => (
						<div key={f.field}>
							<p className="label mb-2">{f.label}</p>
							<ul className="flex flex-col">
								{f.buckets.map((b) => {
									const on = active[f.field] === b.value;
									return (
										<li key={b.value}>
											<button
												type="button"
												onClick={() => toggle(f.field, b.value)}
												aria-pressed={on}
												className={`w-full flex justify-between items-baseline gap-3 py-1 text-[14px] border-l-2 pl-2.5 text-left ${on ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}
											>
												<span className="truncate">{b.value}</span>
												<span className="mono text-[12px]">{b.count}</span>
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</aside>

				<ol className="border-t border-rule-strong">
					{rows.length === 0 && (
						<li className="py-10 text-muted text-[15px]">
							Nothing indexed matches. Broaden the query, or add the provider through a pull
							request.
						</li>
					)}
					{rows.map((r) => (
						<li key={r.identifier} className="border-b border-rule">
							<Link
								href={`/entry/${encodeURIComponent(r.identifier)}`}
								className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-4 group"
							>
								<div className="min-w-0">
									<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
										<span className="font-[family-name:var(--font-display)] font-semibold text-[17px] text-ink group-hover:text-accent transition-colors">
											{r.displayName}
										</span>
										<span className="mono text-[12px] text-muted truncate">{r.publisher}</span>
									</div>
									{r.description && (
										<p className="text-[14.5px] text-muted mt-1 line-clamp-2 max-w-[62ch]">
											{r.description}
										</p>
									)}
									<div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 mono text-[12px] text-muted">
										{r.sector.length > 0 && <span>{r.sector.join(", ")}</span>}
										{r.lineOfBusiness.length > 0 && <span>{r.lineOfBusiness.join(", ")}</span>}
										{r.country.length > 0 && <span>{r.country.join(" ")}</span>}
										{r.actions.length > 0 && (
											<span className="text-ink/80">{r.actions.join(" · ")}</span>
										)}
									</div>
								</div>
								<div className="flex flex-col items-end gap-1.5 shrink-0">
									<div className="flex items-center gap-2">
										<StatusPill status={r.status ?? undefined} />
										<TypeMark type={r.type} />
									</div>
									{r.score !== null && (
										<span className="mono text-[12px] text-muted">score {r.score}</span>
									)}
									{r.capabilities.length > 0 && (
										<span className="mono text-[12px] text-muted">
											{r.capabilities.length} tools
										</span>
									)}
								</div>
							</Link>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
