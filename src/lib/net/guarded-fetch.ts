import { lookup as dnsLookup } from "node:dns/promises";
import { Agent, request } from "node:https";
import { isIP, type LookupFunction } from "node:net";

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

export type VettedTarget = { url: URL; addresses: { address: string; family: number }[] };

/**
 * Parses and vets a URL a visitor supplied, and hands back the addresses it resolved to.
 * Those addresses are what the connection is pinned to: checking a hostname and then letting
 * the socket resolve it again leaves the attacker's own DNS free to answer differently the
 * second time, which is how a vetted domain becomes a connection to the metadata service.
 */
export async function assertPublicUrl(raw: string): Promise<VettedTarget> {
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

	// `URL` keeps the brackets on an IPv6 literal, and `isIP` does not accept them.
	const host = url.hostname.replace(/^\[|\]$/g, "");
	if (isIP(host) !== 0) {
		if (isBlockedAddress(host))
			throw new BlockedUrlError("That address is not reachable from the public internet.");
		return { url, addresses: [{ address: host, family: isIP(host) }] };
	}
	if (!host.includes(".") || host.endsWith(".localhost")) {
		throw new BlockedUrlError("Use a public domain name.");
	}

	let resolved: { address: string; family: number }[];
	try {
		resolved = await dnsLookup(host, { all: true });
	} catch {
		throw new BlockedUrlError(`No DNS record for ${host}.`);
	}
	if (resolved.length === 0 || resolved.some((a) => isBlockedAddress(a.address))) {
		throw new BlockedUrlError(
			"That host resolves to an address that is not reachable from the public internet.",
		);
	}
	return { url, addresses: resolved };
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Answers every resolution with the addresses already vetted, so the socket cannot be redirected by DNS. */
function pinnedLookup(addresses: { address: string; family: number }[]): LookupFunction {
	const first = addresses[0];
	return (_hostname, options, callback) => {
		if (!first) {
			callback(new BlockedUrlError("No vetted address for that host."), "", 0);
			return;
		}
		if (typeof options === "object" && options?.all) {
			callback(null, addresses);
			return;
		}
		callback(null, first.address, first.family);
	};
}

async function bodyToBuffer(body: BodyInit | null | undefined): Promise<Buffer | undefined> {
	if (body === null || body === undefined) return undefined;
	if (typeof body === "string") return Buffer.from(body, "utf8");
	return Buffer.from(await new Response(body).arrayBuffer());
}

/**
 * A `fetch` for the MCP client that vets the host on every request and then connects only to the
 * addresses that vetting returned. Redirects are never followed: a redirect is how a vetted host
 * hands the connection to an unvetted one. The TLS name stays the hostname, so the certificate is
 * still checked against the domain the publisher gave us.
 */
export function guardedFetch(
	timeoutMs: number,
): (url: string | URL, init?: RequestInit) => Promise<Response> {
	return async (target, init) => {
		const { url, addresses } = await assertPublicUrl(
			typeof target === "string" ? target : target.toString(),
		);
		const payload = await bodyToBuffer(init?.body);
		const headers = new Headers(init?.headers);
		const outgoing: Record<string, string> = {};
		headers.forEach((value, key) => {
			outgoing[key] = value;
		});
		if (payload) outgoing["content-length"] = String(payload.byteLength);

		const agent = new Agent({ lookup: pinnedLookup(addresses), keepAlive: false, maxSockets: 1 });

		return await new Promise<Response>((resolve, reject) => {
			const req = request(
				{
					protocol: url.protocol,
					hostname: url.hostname,
					port: url.port || 443,
					path: `${url.pathname}${url.search}`,
					method: init?.method ?? "GET",
					headers: outgoing,
					servername: url.hostname,
					agent,
				},
				(res) => {
					const declared = Number(res.headers["content-length"] ?? "0");
					if (declared > MAX_RESPONSE_BYTES) {
						res.destroy();
						agent.destroy();
						reject(new BlockedUrlError("The server's response is too large to read."));
						return;
					}

					const responseHeaders = new Headers();
					for (const [key, value] of Object.entries(res.headers)) {
						if (value === undefined) continue;
						for (const one of Array.isArray(value) ? value : [value])
							responseHeaders.append(key, one);
					}

					// Built by hand rather than through `Readable.toWeb` so the byte cap lives on the same
					// path as the data, and so the stream is the one a Response actually takes.
					let seen = 0;
					const body = new ReadableStream<Uint8Array>({
						start(controller) {
							res.on("data", (chunk: Buffer) => {
								seen += chunk.byteLength;
								if (seen > MAX_RESPONSE_BYTES) {
									const tooBig = new BlockedUrlError("The server's response is too large to read.");
									controller.error(tooBig);
									res.destroy(tooBig);
									return;
								}
								controller.enqueue(new Uint8Array(chunk));
							});
							res.on("end", () => {
								try {
									controller.close();
								} catch {
									// already errored by the cap
								}
							});
							res.on("error", (error) => controller.error(error));
						},
						cancel() {
							res.destroy();
						},
					});
					res.on("close", () => agent.destroy());

					resolve(
						new Response(body, {
							status: res.statusCode ?? 502,
							statusText: res.statusMessage ?? "",
							headers: responseHeaders,
						}),
					);
				},
			);

			req.setTimeout(timeoutMs, () =>
				req.destroy(new BlockedUrlError("The endpoint did not answer in time.")),
			);
			req.on("error", (error) => {
				agent.destroy();
				reject(error);
			});
			init?.signal?.addEventListener(
				"abort",
				() => req.destroy(new BlockedUrlError("The request was cancelled.")),
				{ once: true },
			);
			if (payload) req.write(payload);
			req.end();
		});
	};
}
