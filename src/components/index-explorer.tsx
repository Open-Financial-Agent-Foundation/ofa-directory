"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EntryRow, type Row, rowFromApi } from "./entry-row";

export type Facet = { field: string; label: string; buckets: { value: string; count: number }[] };

/** The whole index, filterable by facet. Search lives in the hero; this is the browse surface. */
export function IndexExplorer({
	initial,
	facets,
	total,
}: {
	initial: Row[];
	facets: Facet[];
	total: number;
}) {
	const [active, setActive] = useState<Record<string, string>>({});
	const [rows, setRows] = useState<Row[]>(initial);
	const [count, setCount] = useState(total);
	const [busy, setBusy] = useState(false);
	const abort = useRef<AbortController | null>(null);
	const headingId = useId();

	useEffect(() => {
		const entries = Object.entries(active);
		if (entries.length === 0) {
			setRows(initial);
			setCount(total);
			return;
		}
		abort.current?.abort();
		const ctl = new AbortController();
		abort.current = ctl;
		(async () => {
			setBusy(true);
			try {
				const filter = entries.map(([k, v]) => `${k}=${v}`).join(";");
				const res = await fetch(
					`/api/v1/agents?pageSize=100&filter=${encodeURIComponent(filter)}`,
					{ signal: ctl.signal },
				);
				const body: unknown = await res.json();
				if (body && typeof body === "object" && "agents" in body && Array.isArray(body.agents)) {
					setRows(
						body.agents
							.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
							.map(rowFromApi),
					);
					setCount(
						"total" in body && typeof body.total === "number" ? body.total : body.agents.length,
					);
				}
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError"))
					console.error("[ofa] filter failed", { error });
			} finally {
				if (!ctl.signal.aborted) setBusy(false);
			}
		})();
		return () => ctl.abort();
	}, [active, initial, total]);

	const toggle = (field: string, value: string) =>
		setActive((prev) => {
			const next = { ...prev };
			if (next[field] === value) delete next[field];
			else next[field] = value;
			return next;
		});

	const activeCount = Object.keys(active).length;

	return (
		<section aria-labelledby={headingId}>
			<div className="flex items-baseline justify-between gap-6 border-b border-rule pb-4">
				<h2 id={headingId} className="text-[22px]">
					Everything indexed
				</h2>
				<p className="mono text-[12.5px] text-faint" aria-live="polite">
					{busy ? "filtering…" : `${count} of ${total}`}
					{activeCount > 0 && (
						<>
							{" · "}
							<button
								type="button"
								onClick={() => setActive({})}
								className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong"
							>
								clear
							</button>
						</>
					)}
				</p>
			</div>
			<div className="mt-6 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-x-12 gap-y-8">
				<FacetPanel facets={facets} active={active} toggle={toggle} />
				<ol className="border-t border-rule">
					{rows.length === 0 && !busy && (
						<li className="py-10 text-[15px] text-muted">
							No entry carries every selected value. Clear a facet to widen.
						</li>
					)}
					{rows.map((r) => (
						<EntryRow key={r.identifier} row={r} />
					))}
				</ol>
			</div>
		</section>
	);
}

function FacetList({
	facets,
	active,
	toggle,
}: {
	facets: Facet[];
	active: Record<string, string>;
	toggle: (field: string, value: string) => void;
}) {
	return (
		<div className="flex flex-col gap-7">
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
										className={`w-full flex justify-between items-baseline gap-3 py-[5px] text-[14px] text-left transition-colors duration-150 ${on ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
									>
										<span className="truncate">{b.value}</span>
										<span className={`mono text-[12px] ${on ? "text-ink" : "text-faint"}`}>
											{b.count}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</div>
	);
}

/** Facets sit in a rail on wide screens and fold into one disclosure on phones, so the index stays one scroll away. */
function FacetPanel(props: {
	facets: Facet[];
	active: Record<string, string>;
	toggle: (field: string, value: string) => void;
}) {
	const activeCount = Object.keys(props.active).length;
	return (
		<>
			<details className="lg:hidden border-b border-rule pb-4">
				<summary className="cursor-pointer list-none flex items-center justify-between text-[14px] font-medium text-ink py-1">
					<span>Filter{activeCount > 0 ? ` (${activeCount})` : ""}</span>
					<span className="mono text-[12px] text-faint">{props.facets.length} facets</span>
				</summary>
				<div className="mt-4">
					<FacetList {...props} />
				</div>
			</details>
			<aside className="hidden lg:block lg:sticky lg:top-24 self-start">
				<FacetList {...props} />
			</aside>
		</>
	);
}
