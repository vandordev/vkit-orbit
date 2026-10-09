import { expect, test } from "bun:test";
import { authenticateSession } from "./session";
import type { DatabaseClient } from "@repo/db";

test("session authentication returns only public user fields", async () => {
	const db = {
		session: {
			findUnique: async () => ({
				userId: "usr_one",
				id: "session_one",
				revokedAt: null,
				expiresAt: new Date(Date.now() + 60_000),
				user: { id: "usr_one", email: "one@test.invalid", passwordHash: "private-hash", createdAt: new Date(), updatedAt: new Date() },
			}),
		},
	} as unknown as Pick<DatabaseClient, "session">;
	expect(await authenticateSession("ses_test", db)).toEqual({
		userId: "usr_one",
		sessionId: "session_one",
		user: { id: "usr_one", email: "one@test.invalid" },
	});
});
