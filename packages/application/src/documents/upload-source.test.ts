import { expect, test } from "bun:test";
import * as commands from "../index";
import type { DatabaseClient } from "@repo/db";
import type { PutObjectInput } from "@repo/storage";

test("source upload refuses foreign artifacts and never accepts browser object keys", async () => {
	expect("uploadDocumentSource" in commands).toBe(true);
	const db = {
		workspaceMember: { findUnique: async () => ({ role: "OWNER" }) },
		documentArtifact: { findFirst: async () => null },
	} as unknown as DatabaseClient;
	const writes: PutObjectInput[] = [];
	const storage = {
		put: async (input: PutObjectInput) => {
			writes.push(input);
		},
	};
	await expect(
		commands.uploadDocumentSource(
			{ workspaceId: "ws_one", principalId: "usr_one" },
			{
				documentId: "doc_other",
				artifactId: "art_other",
				content: "YQ==",
			},
			storage,
			db,
		),
	).rejects.toMatchObject({ code: "NOT_FOUND" });
	expect(writes).toEqual([]);
});

test("source upload uses stored metadata and rejects size mismatch or a ready document", async () => {
	expect("uploadDocumentSource" in commands).toBe(true);
	let status = "UPLOADING";
	const db = {
		workspaceMember: { findUnique: async () => ({ role: "OWNER" }) },
		documentArtifact: {
			findFirst: async () => ({
				objectKey: "uploads/ws_one/doc_one/art_one",
				byteSize: 1,
				contentType: "text/plain",
				document: { status },
			}),
		},
	} as unknown as DatabaseClient;
	const writes: PutObjectInput[] = [];
	const storage = {
		put: async (input: PutObjectInput) => {
			writes.push(input);
		},
	};
	const scope = { workspaceId: "ws_one", principalId: "usr_one" };
	const input = { documentId: "doc_one", artifactId: "art_one", content: "YQ==" };
	await expect(commands.uploadDocumentSource(scope, { ...input, content: "YWI=" }, storage, db)).rejects.toThrow("size");
	expect(await commands.uploadDocumentSource(scope, input, storage, db)).toEqual({ uploaded: true });
	expect(writes[0]).toMatchObject({ key: "uploads/ws_one/doc_one/art_one", contentType: "text/plain", contentLength: 1 });
	status = "READY";
	await expect(commands.uploadDocumentSource(scope, input, storage, db)).rejects.toThrow("ready");
	expect(writes).toHaveLength(1);
});
