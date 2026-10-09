import { expect, test } from "bun:test";
import { getDocument } from "./index.js";
import type { DatabaseClient } from "@repo/db";

test("a workspace predicate alone cannot authorize a document read", async () => {
	const db = {
		workspaceMember: { findUnique: async () => null },
		document: { findFirst: async () => ({ id: "doc_one", createdAt: new Date(), updatedAt: new Date() }) },
	} as unknown as DatabaseClient;
	await expect(getDocument({ workspaceId: "ws_foreign", principalId: "usr_one" }, "doc_one", db)).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});
