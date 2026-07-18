import { describe, expect, test } from "bun:test";

import { resolvedConfigEnvironment } from "../../../../packages/config/src/run";

Object.assign(process.env, resolvedConfigEnvironment(["base", "api"], { DATABASE_URL: "postgresql://db", NODE_ENV: "test" }));

describe("embedded Elysia health route", () => {
	test("serves Elysia health through TanStack Start", async () => {
		const route = await import("./health");
		const response = await (route.Route as any).options.server.handlers.GET({ request: new Request("http://localhost:4100/health") });
		expect(response.status).toBe(200);
	});
});
