import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * The submission form asks this server to open a connection to a URL a stranger typed,
 * so every address it resolves to has to be checked before a packet leaves. These are the
 * ranges that reach something other than the public internet: loopback, the private
 * blocks, carrier NAT, and the link-local range that carries cloud instance metadata.
 */
const BLOCKED_V4 = [
	"0.0.0.0/8",
	"10.0.0.0/8",
	"100.64.0.0/10",
	"127.0.0.0/8",
	"169.254.0.0/16",
	"172.16.0.0/12",
	"192.0.0.0/24",
	"192.0.2.0/24",
	"192.168.0.0/16",
	"198.18.0.0/15",
	"224.0.0.0/4",
	"240.0.0.0/4",
] as const;

function v4ToInt(ip: string): number | null {
	const parts = ip.split(".");
	if (parts.length !== 4) return null;
	let n = 0;
	for (const part of parts) {
		const byte = Number(part);
		if (!/^\d{1,3}$/.test(part) || !Number.isInteger(byte) || byte > 255) return null;
		n = (n << 8) | byte;
	}
	return n >>> 0;
}

const BLOCKED_V4_PARSED = BLOCKED_V4.map((cidr) => {
	const [net = "", bits = "0"] = cidr.split("/");
	const base = v4ToInt(net) ?? 0;
	const width = Number(bits);
	const mask = width === 0 ? 0 : (0xffffffff << (32 - width)) >>> 0;
	return { base: (base & mask) >>> 0, mask };
});

/** True when the address reaches somewhere this server should never be pointed at. */
export function isBlockedAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 0) return true;

	if (family === 4) {
		const value = v4ToInt(address);
		if (value === null) return true;
		return BLOCKED_V4_PARSED.some((range) => (value & range.mask) >>> 0 === range.base);
	}

	const lower = address.toLowerCase();
	// An IPv4-mapped address is an IPv4 address wearing a v6 spelling; judge the v4 part.
	const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);
	if (mapped?.[1]) return isBlockedAddress(mapped[1]);
	if (lower === "::" || lower === "::1") return true;
	if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
	if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
	return false;
}

export class BlockedUrlError extends Error {}

/** Parses and vets a URL a visitor supplied, resolving its hostname before anything connects. */
export async function assertPublicUrl(raw: string): Promise<URL> {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new BlockedUrlError(
			"That is not a URL. Include the scheme, for example https://example.com/mcp.",
		);
	}
	if (url.protocol !== "https:") {
		throw new BlockedUrlError("The endpoint must be served over HTTPS.");
	}
	if (url.username || url.password) {
		throw new BlockedUrlError("Remove the credentials from the URL.");
	}

	const host = url.hostname;
	if (isIP(host) !== 0) {
		if (isBlockedAddress(host))
			throw new BlockedUrlError("That address is not reachable from the public internet.");
		return url;
	}
	if (!host.includes(".") || host.endsWith(".localhost")) {
		throw new BlockedUrlError("Use a public domain name.");
	}

	let addresses: { address: string }[];
	try {
		addresses = await lookup(host, { all: true });
	} catch {
		throw new BlockedUrlError(`No DNS record for ${host}.`);
	}
	if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
		throw new BlockedUrlError(
			"That host resolves to an address that is not reachable from the public internet.",
		);
	}
	return url;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/**
 * A `fetch` for the MCP client that re-vets every request it makes, refuses redirects
 * (a redirect is how a vetted host hands the connection to an unvetted one) and caps
 * how much a stranger's server can stream back.
 */
export function guardedFetch(
	timeoutMs: number,
): (url: string | URL, init?: RequestInit) => Promise<Response> {
	return async (url, init) => {
		const vetted = await assertPublicUrl(typeof url === "string" ? url : url.toString());
		const response = await fetch(vetted, {
			...init,
			redirect: "error",
			signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
		});

		const declared = Number(response.headers.get("content-length") ?? "0");
		if (declared > MAX_RESPONSE_BYTES) {
			throw new BlockedUrlError("The server's response is too large to read.");
		}
		if (!response.body) return response;

		let seen = 0;
		const capped = response.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, controller) {
					seen += chunk.byteLength;
					if (seen > MAX_RESPONSE_BYTES) {
						controller.error(new BlockedUrlError("The server's response is too large to read."));
						return;
					}
					controller.enqueue(chunk);
				},
			}),
		);
		return new Response(capped, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	};
}
