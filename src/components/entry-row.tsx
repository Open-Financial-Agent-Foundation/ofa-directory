import Link from "next/link";
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

export function rowFromApi(r: Record<string, unknown>): Row {
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

/** One ruled row. `compact` is the hero's four-line answer; the full index shows facet metadata too. */
export function EntryRow({
	row,
	compact = false,
	lead = false,
	index,
}: {
	row: Row;
	compact?: boolean;
	lead?: boolean;
	index?: number;
}) {
	return (
		<li
			className={`border-b border-rule ${index !== undefined ? "rise" : ""}`}
			style={index !== undefined ? { ["--i" as string]: index } : undefined}
		>
			<Link
				href={`/entry/${encodeURIComponent(row.identifier)}`}
				className={`grid grid-cols-[1fr_auto] items-start gap-x-8 -mx-3 px-3 rounded-lg hover:bg-fill-hover transition-colors duration-150 ${compact ? "py-3.5" : "py-4"}`}
			>
				<div className="min-w-0">
					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
						<span className="font-medium text-[16px] text-ink leading-6">{row.displayName}</span>
						<span className="mono text-[12px] text-faint truncate">{row.publisher}</span>
					</div>
					{row.description && (
						<p
							className={`text-[14.5px] text-muted mt-0.5 max-w-[64ch] ${compact ? "truncate" : "line-clamp-2"}`}
						>
							{row.description}
						</p>
					)}
					{!compact && (
						<div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[13px] text-faint">
							{row.sector.length > 0 && <span>{row.sector.join(", ")}</span>}
							{row.lineOfBusiness.length > 0 && <span>{row.lineOfBusiness.join(", ")}</span>}
							{row.country.length > 0 && (
								<span className="mono text-[12px]">{row.country.join(" ")}</span>
							)}
							{row.actions.length > 0 && (
								<span className="text-muted">{row.actions.join(" · ")}</span>
							)}
						</div>
					)}
				</div>
				<div className={`flex items-center gap-3 shrink-0 ${compact ? "pt-1" : "pt-0.5"}`}>
					{!compact && <StatusPill status={row.status ?? undefined} />}
					{!compact && <TypeMark type={row.type} />}
					{row.score !== null && (
						<span className={`mono text-[13px] w-8 text-right ${lead ? "text-ink" : "text-faint"}`}>
							<span className="sr-only">relevance </span>
							{row.score}
						</span>
					)}
					{compact && row.score === null && <TypeMark type={row.type} />}
				</div>
			</Link>
		</li>
	);
}
