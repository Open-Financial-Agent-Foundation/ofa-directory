"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { SearchIcon } from "./arrow-icon";
import { EntryRow, type Row, rowFromApi } from "./entry-row";

export type Demo = { query: string; rows: Row[] };

const TYPE_MS = 34;
const HOLD_MS = 3200;

function prefersReducedMotion(): boolean {
	return (
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

/**
 * The first viewport: a real need typed into the field and the index answering under it.
 * The demo cycles through pre-ranked needs until the visitor touches the field; from then on
 * the field is live search against /api/v1/search.
 */
export function HeroSearch({ demos, total }: { demos: Demo[]; total: number }) {
	const first = demos[0];
	const [mode, setMode] = useState<"demo" | "live">("demo");
	const demoIndex = useRef(0);
	const [typed, setTyped] = useState(first?.query ?? "");
	const [rows, setRows] = useState<Row[]>(first?.rows ?? []);
	const [revealKey, setRevealKey] = useState(0);
	const [settled, setSettled] = useState(true);
	const [value, setValue] = useState("");
	const [count, setCount] = useState<number | null>(null);
	const [busy, setBusy] = useState(false);
	const inputId = useId();
	const abort = useRef<AbortController | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Demo loop: type the next need, then rank.
	useEffect(() => {
		if (mode !== "demo" || demos.length < 2 || prefersReducedMotion()) return;
		let cancelled = false;
		const timers: ReturnType<typeof setTimeout>[] = [];
		const run = (index: number) => {
			const demo = demos[index];
			if (!demo) return;
			setSettled(false);
			setTyped("");
			for (let i = 1; i <= demo.query.length; i += 1) {
				timers.push(
					setTimeout(() => !cancelled && setTyped(demo.query.slice(0, i)), 320 + i * TYPE_MS),
				);
			}
			const done = 320 + demo.query.length * TYPE_MS + 180;
			timers.push(
				setTimeout(() => {
					if (cancelled) return;
					setRows(demo.rows);
					demoIndex.current = index;
					setRevealKey((k) => k + 1);
					setSettled(true);
				}, done),
			);
			timers.push(setTimeout(() => !cancelled && run((index + 1) % demos.length), done + HOLD_MS));
		};
		timers.push(setTimeout(() => run((demoIndex.current + 1) % demos.length), HOLD_MS));
		return () => {
			cancelled = true;
			for (const t of timers) clearTimeout(t);
		};
	}, [mode, demos]);

	const goLive = useCallback(() => {
		if (mode === "live") return;
		setMode("live");
		setTyped("");
		setValue("");
		setRows([]);
		setCount(null);
	}, [mode]);

	// Live search.
	useEffect(() => {
		if (mode !== "live") return;
		const text = value.trim();
		if (!text) {
			setRows([]);
			setCount(null);
			return;
		}
		abort.current?.abort();
		const ctl = new AbortController();
		abort.current = ctl;
		const t = setTimeout(async () => {
			setBusy(true);
			try {
				const res = await fetch("/api/v1/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ query: { text }, pageSize: 6 }),
					signal: ctl.signal,
				});
				const body: unknown = await res.json();
				if (body && typeof body === "object" && "results" in body && Array.isArray(body.results)) {
					setRows(
						body.results
							.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
							.map(rowFromApi),
					);
					setCount(
						"total" in body && typeof body.total === "number" ? body.total : body.results.length,
					);
					setRevealKey((k) => k + 1);
				}
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError"))
					console.error("[ofa] search failed", { error });
			} finally {
				if (!ctl.signal.aborted) setBusy(false);
			}
		}, 140);
		return () => clearTimeout(t);
	}, [mode, value]);

	const showing = mode === "demo" ? typed : value;
	const emptyLive = mode === "live" && value.trim() && !busy && rows.length === 0;

	return (
		<section aria-labelledby={`${inputId}-label`} className="max-w-[760px]">
			<label id={`${inputId}-label`} htmlFor={inputId} className="sr-only">
				Search the index
			</label>
			<div className="relative">
				<SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
				<input
					ref={inputRef}
					id={inputId}
					type="search"
					value={mode === "live" ? value : ""}
					onChange={(e) => setValue(e.target.value)}
					onFocus={goLive}
					onPointerDown={goLive}
					placeholder={mode === "live" ? "Describe what the user needs" : ""}
					autoComplete="off"
					spellCheck={false}
					aria-describedby={`${inputId}-hint`}
					className="w-full h-14 bg-paper border border-rule-strong rounded-xl pl-12 pr-5 sm:pr-28 text-[17px] text-ink placeholder:text-faint focus:border-ink outline-none transition-[border-color] duration-150"
				/>
				{mode === "demo" && (
					<div
						aria-hidden="true"
						className={`pointer-events-none absolute inset-y-0 left-12 right-5 sm:right-28 flex items-center text-[17px] text-ink overflow-hidden whitespace-nowrap ${settled ? "" : "caret"}`}
					>
						<span className="truncate">{showing}</span>
						{settled && <span className="caret" />}
					</div>
				)}
				<span
					id={`${inputId}-hint`}
					className="hidden sm:inline absolute right-5 top-1/2 -translate-y-1/2 mono text-[12px] text-faint"
					aria-live="polite"
				>
					{mode === "demo"
						? `${total} entries`
						: busy
							? "ranking…"
							: count === null
								? ""
								: `${count} ${count === 1 ? "match" : "matches"}`}
				</span>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 mt-3 text-[13px]">
				<p className="text-faint">
					{mode === "demo"
						? "Ranked live. Relevance 0–100 is not a measure of trust."
						: "Relevance 0–100 is not a measure of trust."}
				</p>
				<span className="flex items-center gap-4 shrink-0">
					<Link
						href="/docs/connect"
						className="text-muted hover:text-ink transition-colors duration-150"
					>
						Connect your agent
					</Link>
					<Link href="/submit" className="text-muted hover:text-ink transition-colors duration-150">
						Publish yours
					</Link>
				</span>
			</div>

			<ol
				key={revealKey}
				className="mt-6 border-t border-rule min-h-[268px]"
				aria-label="Ranked providers"
			>
				{rows.map((r, i) => (
					<EntryRow key={r.identifier} row={r} compact lead={i === 0} index={i} />
				))}
				{emptyLive && (
					<li className="py-8 text-[15px] text-muted">
						Nothing indexed matches yet.{" "}
						<Link
							href="/docs/publish"
							className="text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
						>
							Publish the provider
						</Link>{" "}
						or try a broader need.
					</li>
				)}
				{mode === "live" && !value.trim() && (
					<li className="py-8 text-[15px] text-faint">
						Type a need, in any language the providers speak.
					</li>
				)}
			</ol>
		</section>
	);
}
