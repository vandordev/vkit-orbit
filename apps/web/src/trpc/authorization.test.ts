import { expect, test } from "bun:test";
import { router, workspaceProcedure, permissionProcedure } from "./init";
import type { TRPCContext } from "./context";

// Only persistence is substituted; callers exercise the real tRPC middleware.
function context(role: "OWNER" | "VIEWER" | null): TRPCContext {
	return {
		req: new Request("https://example.test/trpc"),
		responseHeaders: new Headers(),
		session: { userId: "usr_one", sessionId: "ses_one", user: { id: "usr_one", email: "one@test.invalid" } },
		database: { workspaceMember: { findUnique: async () => (role ? { role, workspaceId: "ws_one", userId: "usr_one" } : null) } },
	} as unknown as TRPCContext;
}

test("workspace procedures reject a logged-in non-member", async () => {
	const routes = router({ read: workspaceProcedure.query(() => "private") });
	await expect(routes.createCaller(context(null)).read({ workspaceId: "ws_one" })).rejects.toMatchObject({ code: "FORBIDDEN" });
});

test("workspace procedure validates the workspace selector", async () => {
	const routes = router({ read: workspaceProcedure.query(() => "private") });
	await expect(routes.createCaller(context("OWNER")).read({ workspaceId: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

test("permission procedure rejects writes from viewers and accepts owners", async () => {
	expect(typeof permissionProcedure).toBe("function");
	const routes = router({ write: permissionProcedure("documents:write").mutation(({ ctx }) => ctx.workspace.id) });
	await expect(routes.createCaller(context("VIEWER")).write({ workspaceId: "ws_one" })).rejects.toMatchObject({ code: "FORBIDDEN" });
	expect(await routes.createCaller(context("OWNER")).write({ workspaceId: "ws_one" })).toBe("ws_one");
});
