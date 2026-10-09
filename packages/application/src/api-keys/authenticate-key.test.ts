import { expect, test } from "bun:test";
import { authenticateApiKey } from "./authenticate-key";
import type { DatabaseClient } from "@repo/db";

test("an API key cannot outlive its owner's workspace membership", async () => {
	let used = false;
	const db = {
		apiKey: {
			findUnique: async () => ({
				id: "key_one",
				workspaceId: "ws_one",
				userId: "usr_one",
				revokedAt: null,
				expiresAt: null,
				scopes: ["documents:write"],
			}),
			update: async () => {
				used = true;
			},
		},
		workspaceMember: { findUnique: async () => null },
	} as unknown as DatabaseClient;
	await expect(authenticateApiKey("synthetic-secret", db)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	expect(used).toBe(false);
});
