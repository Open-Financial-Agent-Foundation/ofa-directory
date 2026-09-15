const SHORT: Record<string, string> = {
	"application/mcp-server-card+json": "MCP",
	"application/a2a-agent-card+json": "A2A",
	"application/openapi+json": "OpenAPI",
	"application/openapi+yaml": "OpenAPI",
	"application/ai-skill+md": "Skill",
	"application/ai-registry+json": "Registry",
	"application/ai-catalog+json": "Catalog",
	"text/html": "Listing",
};

export function TypeMark({ type }: { type: string }) {
	return (
		<span
			className="mono text-[11.5px] text-muted border border-rule-strong px-2 py-[3px] rounded-full leading-none"
			title={type}
		>
			{SHORT[type] ?? type}
		</span>
	);
}
