import { expect, test } from "bun:test";
import * as urls from "./safe-url";

test("webhook URL policy rejects private, mapped, metadata and mixed DNS targets", async () => {
	for (const address of [
		"127.0.0.1",
		"10.0.0.1",
		"169.254.169.254",
		"192.168.1.1",
		"172.16.0.1",
		"::1",
		"::ffff:127.0.0.1",
		"fc00::1",
		"fe80::1",
		"64:ff9b::a00:1",
	]) {
		await expect(urls.validateWebhookUrl("https://merchant.test/hook", { resolve: async () => [address] })).rejects.toThrow();
	}
	await expect(urls.validateWebhookUrl("https://merchant.test", { resolve: async () => ["8.8.8.8", "127.0.0.1"] })).rejects.toThrow();
	for (const value of [
		"http://merchant.test",
		"https://user:pass@merchant.test",
		"https://merchant.test:8443",
		"https://merchant.test/#secret",
	]) {
		await expect(urls.validateWebhookUrl(value, { resolve: async () => ["8.8.8.8"] })).rejects.toThrow();
	}
	const allowed = await urls.validateWebhookUrl("https://merchant.test/hook", { resolve: async () => ["8.8.8.8"] });
	expect(allowed.address).toBe("8.8.8.8");
	expect(allowed.url.hostname).toBe("merchant.test");
});
