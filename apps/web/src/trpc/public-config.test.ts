import { expect, test } from "bun:test";
import { createTRPCContext } from "./context";
import { appRouter } from "./routers";
import { handleTRPC } from "./handler";
import { publicWebConfigSchema } from "@repo/config/public";
import { createConfigRouter } from "./routers/config";

test("projection failures become generic errors rather than config diagnostics", async () => {
	const context = createTRPCContext({ req: new Request("https://example.test/trpc") });
	const routes = createConfigRouter(() => { throw new Error("sensitive-value-diagnostic"); });
	await expect(routes.createCaller(context).public()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: "Runtime configuration unavailable" });
});

test("public config does not invoke cookie session or database accessors", async () => {
	const context = createTRPCContext({ req: new Request("https://example.test/trpc", { headers: { cookie: "session=ses_fixture" } }) });
	context.getSession = () => { throw new Error("session lookup forbidden"); };
	context.getDatabase = () => { throw new Error("database lookup forbidden"); };
	const value = await appRouter.createCaller(context).config.public();
	expect(Object.keys(value)).toEqual(["realtimeUrl"]);
	expect(publicWebConfigSchema.safeParse({ ...value, secret: "forbidden" }).success).toBe(false);
});

test("public config rejects caller-selected keys and unauthenticated procedures remain protected", async () => {
	const context = createTRPCContext({ req: new Request("https://example.test/trpc") });
	await expect(appRouter.createCaller(context).auth.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	const response = await handleTRPC(new Request('https://example.test/trpc/config.public?input=%7B%22key%22%3A%22database%22%7D'));
	expect(response.status).toBe(400);
	expect(response.headers.get("cache-control")).toBe("no-store");
});
test("session lookup memoizes concurrent calls and status remains explicit", async () => {
	let count = 0;
	const context = createTRPCContext({ req: new Request("https://example.test/trpc", { headers: { cookie: "session=ses_fixture" } }) }, {
		authenticateSession: async () => { count++; return { userId: "user", sessionId: "session", user: { id: "user", email: "fixture@test.invalid" } }; },
		getDatabase: () => { throw new Error("database forbidden"); },
	});
	await Promise.all([context.getSession(), context.getSession()]);
	expect(count).toBe(1);
	expect(await appRouter.createCaller(context).auth.status()).toEqual({ authenticated: true });
});
test("no-store covers public, mixed/failed batches and same-origin failures", async () => {
	for (const path of ["config.public", "config.public,auth.me?batch=1", "config.public,missing?batch=1"]) {
		const response = await handleTRPC(new Request(`https://example.test/trpc/${path}`));
		expect(response.headers.get("cache-control")).toBe("no-store");
	}
	const response = await handleTRPC(new Request("https://example.test/trpc/config.public", { method: "POST", headers: { origin: "https://other.test" } }));
	expect(response.status).toBe(403);
	expect(response.headers.get("cache-control")).toBe("no-store");
});
