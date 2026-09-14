import { NextResponse } from "next/server";

/** ARD Appendix B error envelope. */
export function apiError(status: number, code: string, message: string): NextResponse {
	return NextResponse.json({ error: { code, message } }, { status });
}

export function json(body: unknown, init?: { status?: number; cache?: string }): NextResponse {
	return NextResponse.json(body, {
		status: init?.status ?? 200,
		headers: { "cache-control": init?.cache ?? "public, max-age=60, s-maxage=300" },
	});
}

export function preflight(): Response {
	return new Response(null, { status: 204 });
}
