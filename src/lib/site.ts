/**
 * Where this registry lives. NEXT_PUBLIC_SITE_URL wins; otherwise the incoming request's origin,
 * so previews and local runs print URLs that resolve; Vercel's URL is the last resort.
 */
export function siteUrl(request?: Request): string {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL;
	if (explicit) return explicit.replace(/\/$/, "");
	if (request) {
		const u = new URL(request.url);
		const proto = request.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
		const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? u.host;
		return `${proto}://${host}`;
	}
	const vercel = process.env.VERCEL_URL;
	if (vercel) return `https://${vercel}`;
	return "http://localhost:3000";
}

export const SITE = {
	name: "FinCommons",
	tagline: "The open index of financial services for AI agents.",
	repo: "https://github.com/fincommons/fincommons",
	specVersion: "ARD v0.91",
} as const;

export function apiBase(request?: Request): string {
	return `${siteUrl(request)}/api/v1`;
}
