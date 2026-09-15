const STYLES: Record<string, string> = {
	live: "bg-live-soft text-live",
	demo: "bg-accent-soft text-muted",
	listing: "bg-code text-muted",
};

export function StatusPill({ status }: { status: string | undefined }) {
	if (!status) return null;
	return (
		<span
			className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${STYLES[status] ?? STYLES.listing}`}
		>
			{status}
		</span>
	);
}
