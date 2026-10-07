import { expect, test } from "bun:test";
import { appRouter } from "./routers";
import type { TRPCContext } from "./context";

test("settings lists read scoped persisted metadata without credential fields", async () => {
	const queries: unknown[] = [];
	const ctx = {
		req: new Request("https://example.test"),
		responseHeaders: new Headers(),
		session: { userId: "usr_one", sessionId: "ses_one", user: { id: "usr_one", email: "one@test.invalid" } },
		database: {
			workspaceMember: { findUnique: async () => ({ role: "OWNER" }) },
			apiKey: {
				findMany: async (query: unknown) => {
					queries.push(query);
					return [{ id: "key_one", name: "One" }];
				},
			},
			webhookEndpoint: {
				findMany: async (query: unknown) => {
					queries.push(query);
					return [{ id: "wh_one", url: "https://merchant.test" }];
				},
			},
			workspace: { findUniqueOrThrow: async () => ({ id: "ws_one", name: "One", slug: "one" }) },
		},
	} as unknown as TRPCContext;
	const caller = appRouter.createCaller(ctx);
	expect(await caller.apiKeys.list({ workspaceId: "ws_one" })).toMatchObject([{ id: "key_one", name: "One" }]);
	expect(await caller.webhooks.list({ workspaceId: "ws_one" })).toMatchObject([{ id: "wh_one", url: "https://merchant.test" }]);
	expect(await caller.workspace.current({ workspaceId: "ws_one" })).toEqual({ id: "ws_one", name: "One", slug: "one" });
	for (const query of queries) {
		expect(query).toMatchObject({ where: { workspaceId: "ws_one" }, take: 100 });
		expect(JSON.stringify(query)).not.toMatch(/secretHash|encryptedSecret|passwordHash/);
	}
});
