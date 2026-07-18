import { describe, expect, test } from "bun:test";

import { resolvedConfigEnvironment } from "../../../../packages/config/src/run";

Object.assign(process.env, resolvedConfigEnvironment(["base", "api"], { DATABASE_URL: "postgresql://db", NODE_ENV: "test" }));

describe("embedded Elysia route handler", () => {
	test("delegates every supported method to Elysia", async () => {
		const route = await import("./api.$");
		const response = await (route.Route as any).options.server.handlers.GET({ request: new Request("http://localhost:4100/api/status") });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: { status: "ok" } });
	});
});
