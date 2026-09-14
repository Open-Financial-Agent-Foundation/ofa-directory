const STYLES: Record<string, string> = {
	live: "bg-live-soft text-live",
	demo: "bg-accent-soft text-accent",
	listing: "bg-code text-muted",
};

export function StatusPill({ status }: { status: string | undefined }) {
	if (!status) return null;
	return (
		<span
			className={`mono text-[11px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[3px] ${STYLES[status] ?? STYLES.listing}`}
		>
			{status}
		</span>
	);
}
