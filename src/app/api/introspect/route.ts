import { z } from "zod";
import { apiError, json, preflight } from "@/lib/api/respond";
import { BlockedUrlError } from "@/lib/net/guarded-fetch";
import { IntrospectError, introspect } from "@/lib/registry/introspect";

export const runtime = "nodejs";
export const maxDuration = 30;

export const OPTIONS = preflight;

const bodySchema = z.object({ url: z.string().min(8).max(2048) });

/**
 * Per-instance and therefore approximate: a serverless deployment runs several of these at once,
 * so this bounds one visitor hammering one instance rather than the whole endpoint. It is the
 * cheap half of the protection; the address vetting in `guarded-fetch` is the half that matters.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 5000) hits.clear();
	return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (rateLimited(ip)) {
		return apiError(
			429,
			"RESOURCE_EXHAUSTED",
			"Too many reads from this address. Wait a minute and try again.",
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError(400, "INVALID_ARGUMENT", "Body must be JSON.");
	}
	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return apiError(400, "INVALID_ARGUMENT", "Send a JSON body with a `url`.");

	try {
		const draft = await introspect(parsed.data.url.trim());
		return json(draft, { cache: "no-store" });
	} catch (error) {
		if (error instanceof BlockedUrlError) return apiError(400, "INVALID_ARGUMENT", error.message);
		if (error instanceof IntrospectError) {
			return apiError(
				502,
				"UPSTREAM_UNAVAILABLE",
				`That endpoint did not answer MCP over Streamable HTTP. ${error.message}`,
			);
		}
		console.error("[ofa] introspect failed", { error });
		return apiError(500, "INTERNAL", "Could not read that endpoint.");
	}
}
