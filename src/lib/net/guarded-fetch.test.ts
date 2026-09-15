import { describe, expect, test } from "bun:test";
import { assertPublicUrl, BlockedUrlError, isBlockedAddress } from "./guarded-fetch";

describe("isBlockedAddress", () => {
	test("refuses the ranges that do not reach the public internet", () => {
		for (const address of [
			"127.0.0.1",
			"127.255.255.254",
			"10.0.0.1",
			"10.255.255.255",
			"172.16.0.1",
			"172.31.255.255",
			"192.168.1.1",
			"169.254.169.254",
			"100.64.0.1",
			"0.0.0.0",
			"198.18.0.1",
			"224.0.0.1",
			"240.0.0.1",
			"::1",
			"::",
			"fc00::1",
			"fd12:3456::1",
			"fe80::1",
			"::ffff:127.0.0.1",
			"::ffff:169.254.169.254",
		]) {
			expect(isBlockedAddress(address)).toBe(true);
		}
	});

	test("allows ordinary public addresses", () => {
		for (const address of [
			"1.1.1.1",
			"8.8.8.8",
			"93.184.216.34",
			"172.32.0.1",
			"192.167.255.255",
			"2606:4700::1111",
		]) {
			expect(isBlockedAddress(address)).toBe(false);
		}
	});

	test("refuses anything that is not an address at all", () => {
		for (const value of ["", "not-an-ip", "999.1.1.1", "10.0.0", "0x7f.1", "127.0.0.1 "]) {
			expect(isBlockedAddress(value)).toBe(true);
		}
	});
});

describe("assertPublicUrl", () => {
	test("requires HTTPS", async () => {
		await expect(assertPublicUrl("http://example.com/mcp")).rejects.toBeInstanceOf(BlockedUrlError);
	});

	test("refuses credentials in the URL", async () => {
		await expect(assertPublicUrl("https://user:pass@example.com/mcp")).rejects.toBeInstanceOf(
			BlockedUrlError,
		);
	});

	test("refuses a literal address inside a blocked range, bracketed IPv6 included", async () => {
		await expect(
			assertPublicUrl("https://169.254.169.254/latest/meta-data"),
		).rejects.toBeInstanceOf(BlockedUrlError);
		await expect(assertPublicUrl("https://[::1]/mcp")).rejects.toBeInstanceOf(BlockedUrlError);
		await expect(assertPublicUrl("https://[fd00::1]/mcp")).rejects.toBeInstanceOf(BlockedUrlError);
	});

	test("refuses a bare hostname and anything that is not a URL", async () => {
		await expect(assertPublicUrl("https://localhost/mcp")).rejects.toBeInstanceOf(BlockedUrlError);
		await expect(assertPublicUrl("not-a-url")).rejects.toBeInstanceOf(BlockedUrlError);
	});

	test("returns the addresses the connection is then pinned to", async () => {
		const { url, addresses } = await assertPublicUrl("https://example.com/mcp");
		expect(url.hostname).toBe("example.com");
		expect(addresses.length).toBeGreaterThan(0);
		for (const a of addresses) expect(isBlockedAddress(a.address)).toBe(false);
	});
});
