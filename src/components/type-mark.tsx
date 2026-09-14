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
			className="mono text-[12px] text-ink border border-rule-strong px-1.5 py-0.5 rounded-[3px]"
			title={type}
		>
			{SHORT[type] ?? type}
		</span>
	);
}
