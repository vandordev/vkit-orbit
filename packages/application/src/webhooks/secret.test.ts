import { expect, test } from "bun:test";
import * as crypto from "../index";

test("webhook secret ciphertext is randomized, authenticated and never plaintext", () => {
	expect("createWebhookSecretCrypto" in crypto).toBe(true);
	const key = crypto.createWebhookSecretCrypto("a".repeat(64));
	const encrypted = key.encrypt("synthetic-secret");
	expect(encrypted).not.toContain("synthetic-secret");
	expect(key.encrypt("synthetic-secret")).not.toBe(encrypted);
	expect(key.decrypt(encrypted)).toBe("synthetic-secret");
	expect(() => crypto.createWebhookSecretCrypto("b".repeat(64)).decrypt(encrypted)).toThrow();
	expect(() => key.decrypt(`${encrypted.slice(0, -4)}AAAA`)).toThrow();
});
