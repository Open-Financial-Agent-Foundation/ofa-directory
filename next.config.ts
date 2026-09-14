import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// The registry and the docs are plain files in git; the serverless bundle must carry them.
	outputFileTracingIncludes: {
		"/**": ["./registry/**/*", "./docs/**/*", "./spec/**/*"],
	},
	async headers() {
		return [
			{
				source: "/.well-known/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Cache-Control", value: "public, max-age=300, s-maxage=3600" },
				],
			},
			{
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
					{ key: "Access-Control-Allow-Headers", value: "content-type, accept, authorization, mcp-session-id, mcp-protocol-version" },
				],
			},
			{
				source: "/mcp",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
					{ key: "Access-Control-Allow-Headers", value: "content-type, accept, authorization, mcp-session-id, mcp-protocol-version" },
					{ key: "Access-Control-Expose-Headers", value: "mcp-session-id, mcp-protocol-version" },
				],
			},
		];
	},
};

export default nextConfig;
