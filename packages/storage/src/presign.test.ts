import { expect, test } from "bun:test";
import { createStorageClient } from "./client";

const config = { bucket: "docs", region: "us-east-1", accessKeyId: "id", secretAccessKey: "secret", rootPrefix: "tenant" };

test("presigns bounded upload and download commands with metadata", async () => {
	const calls: Array<{ command: { input: any }; options: { expiresIn: number } }> = [];
	const storage = createStorageClient(config, { send: async () => ({}) }, async (_client, command: any, options: any) => {
		calls.push({ command, options });
		return "https://signed.test";
	});
	expect(
		await storage.createUploadUrl({
			workspaceId: "ws",
			documentId: "doc",
			artifactId: "art",
			contentType: "text/plain",
			contentLength: 12,
			expiresIn: 9999,
		}),
	).toBe("https://signed.test");
	expect(await storage.createDownloadUrl({ key: "tenant/uploads/x", expiresIn: 9999 })).toBe("https://signed.test");
	expect(calls[0]?.options.expiresIn).toBe(900);
	expect(calls[0]?.command.input).toMatchObject({
		ContentType: "text/plain",
		ContentLength: 12,
		Key: "tenant/uploads/workspaces/ws/documents/doc/source/art",
	});
	expect(calls[1]?.options.expiresIn).toBe(300);
});
