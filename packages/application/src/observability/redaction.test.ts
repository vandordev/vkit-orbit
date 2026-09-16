import { describe, expect, test } from "bun:test";

import { redact } from "./redaction";

describe("observability redaction", () => {
	test("removes every credential and sensitive document field", () => {
		const value = redact({
			authorization: "Bearer secret-token",
			cookie: "session=secret-cookie",
			apiKey: "dph_secret-key",
			webhookSecret: "webhook-secret",
			signedUrl: "https://storage.test/result?X-Amz-Signature=secret-signature",
			documentContent: "private document text",
			storageSecretAccessKey: "storage-secret",
			redisUrl: "redis://:password@redis:6379/0",
			databaseUrl: "postgresql://user:password@db/app",
		});
		const serialized = JSON.stringify(value);
		expect(serialized).not.toContain("secret");
		expect(serialized).not.toContain("private document text");
		expect(serialized).not.toContain("password");
	});
});
