import { expect, test } from "bun:test";
import { withPostgres } from "./harness";
import { executeIdempotent } from "@repo/application";
import { getDocument } from "@repo/query";
import { router, permissionProcedure } from "../../../../apps/web/src/trpc/init";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

test("parallel idempotent commands commit once, reject foreign replay, and release on rollback", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		const scope = { workspaceId: "ws_one", principalId: "usr_one" };
		const action = async (tx: Parameters<Parameters<typeof executeIdempotent>[4]>[0]) => {
			await Bun.sleep(40);
			const id = `doc_${crypto.randomUUID()}`;
			await tx.document.create({ data: { id, workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1 } });
			return { id };
		};
		const results = await Promise.all(
			Array.from({ length: 4 }, () => executeIdempotent(scope, "create", "one-key", { title: "One" }, action, db)),
		);
		expect(new Set(results.map((result) => result.id)).size).toBe(1);
		expect(await db.document.count()).toBe(1);
		await expect(
			executeIdempotent({ ...scope, principalId: "usr_other" }, "create", "one-key", { title: "One" }, action, db),
		).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
		await expect(executeIdempotent(scope, "create", "one-key", { title: "Different" }, action, db)).rejects.toMatchObject({
			code: "IDEMPOTENCY_CONFLICT",
		});
		await expect(
			executeIdempotent(
				scope,
				"create",
				"rollback-key",
				{},
				async () => {
					throw new Error("rollback");
				},
				db,
			),
		).rejects.toThrow("rollback");
		expect(await executeIdempotent(scope, "create", "rollback-key", {}, async () => ({ ok: true }), db)).toEqual({ ok: true });
	});
}, 60_000);

test("real membership and mounted tRPC deny foreign workspaces and viewer writes", async () => {
	await withPostgres(async (db) => {
		await db.user.create({ data: { id: "usr_one", email: "one@test.invalid", passwordHash: "synthetic" } });
		await db.workspace.createMany({
			data: [
				{ id: "ws_one", name: "One", slug: "one" },
				{ id: "ws_other", name: "Other", slug: "other" },
			],
		});
		await db.workspaceMember.create({ data: { workspaceId: "ws_one", userId: "usr_one", role: "VIEWER" } });
		await db.document.create({
			data: { id: "doc_other", workspaceId: "ws_other", title: "Other", contentType: "text/plain", byteSize: 1 },
		});
		await expect(getDocument({ workspaceId: "ws_other", principalId: "usr_one" }, "doc_other", db)).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
		const session = await db.session.create({
			data: { id: "ses_one", userId: "usr_one", tokenHash: "synthetic", expiresAt: new Date(Date.now() + 60_000) },
		});
		const routes = router({ write: permissionProcedure("documents:write").mutation(() => ({ ok: true })) });
		const call = (workspaceId: string) =>
			fetchRequestHandler({
				endpoint: "/trpc",
				req: new Request("https://example.test/trpc/write", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ workspaceId }),
				}),
				router: routes,
				createContext: () => ({
					req: new Request("https://example.test"),
					database: db,
					responseHeaders: new Headers(),
					session: { userId: session.userId, sessionId: session.id, user: { id: "usr_one", email: "one@test.invalid" } },
				}),
			});
		expect((await call("ws_other")).status).toBe(403);
		expect((await call("ws_one")).status).toBe(403);
		await db.workspaceMember.update({
			where: { workspaceId_userId: { workspaceId: "ws_one", userId: "usr_one" } },
			data: { role: "OWNER" },
		});
		expect((await call("ws_one")).status).toBe(200);
	});
}, 60_000);
