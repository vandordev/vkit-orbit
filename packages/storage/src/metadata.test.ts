import { expect, test } from "bun:test";
import { createStorageClient } from "./client";

test("supports head, delete, and content length on put", async () => {
	const commands: Array<{ input: Record<string, unknown> }> = [];
	const storage = createStorageClient(
		{ bucket: "b", region: "r", accessKeyId: "i", secretAccessKey: "s", rootPrefix: "root" },
		{
			send: async (command: any) => {
				commands.push(command);
				return {};
			},
		},
	);
	await storage.put({ key: "root/uploads/a", body: new Uint8Array([1, 2]), contentType: "text/markdown", contentLength: 2 });
	await storage.head("root/uploads/a");
	await storage.delete("root/uploads/a");
	expect(commands.map((command) => command.input)).toEqual([
		{ Bucket: "b", Key: "root/uploads/a", Body: new Uint8Array([1, 2]), ContentType: "text/markdown", ContentLength: 2 },
		{ Bucket: "b", Key: "root/uploads/a" },
		{ Bucket: "b", Key: "root/uploads/a" },
	]);
});
