import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getWebhookConfig } from "@repo/config/server";

export function createWebhookSecretCrypto(hexKey: string) {
	if (!/^[a-f0-9]{64}$/i.test(hexKey)) throw new Error("Invalid webhook encryption key");
	const key = Buffer.from(hexKey, "hex");
	return {
		encrypt(secret: string) {
			const iv = randomBytes(12);
			const cipher = createCipheriv("aes-256-gcm", key, iv);
			const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
			return `v1.${Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64")}`;
		},
		decrypt(value: string) {
			try {
				if (!value.startsWith("v1.")) throw new Error();
				const bytes = Buffer.from(value.slice(3), "base64");
				if (bytes.length <= 28) throw new Error();
				const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
				cipher.setAuthTag(bytes.subarray(12, 28));
				return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8");
			} catch {
				throw new Error("WEBHOOK_SECRET_DECRYPTION_FAILED");
			}
		},
	};
}

export type WebhookSecretCrypto = ReturnType<typeof createWebhookSecretCrypto>;
export function runtimeWebhookSecretCrypto(): WebhookSecretCrypto {
	const key = getWebhookConfig().secretEncryptionKey;
	if (!key) throw new Error("Webhook encryption is not configured");
	return createWebhookSecretCrypto(key);
}
