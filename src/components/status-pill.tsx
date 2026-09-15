const CLASS: Record<string, string> = {
	live: "status status-live",
	demo: "status status-demo",
	listing: "status status-listing",
};

/** live: the endpoint answered MCP at last check. demo: the publisher says so. listing: a directory page, no endpoint. */
export function StatusPill({ status }: { status: string | undefined }) {
	if (!status) return null;
	return <span className={CLASS[status] ?? CLASS.listing}>{status}</span>;
}
