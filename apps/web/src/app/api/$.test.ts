import { describe, expect, test } from "bun:test";

import { resolvedConfigEnvironment } from "../../../../../packages/config/src/run";

Object.assign(process.env, resolvedConfigEnvironment(["base", "api"], { DATABASE_URL: "postgresql://db", NODE_ENV: "test" }));

describe("embedded Elysia route handler", () => {
	test("delegates every supported method to Elysia", async () => {
		const route = await import("./$");
		const handlers = (route.Route as any).options.server.handlers;
		expect(Object.keys(handlers).sort()).toEqual(["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]);
		expect((route.Route as any).options.component).toBeUndefined();
		expect((route.Route as any).options.errorComponent).toBeUndefined();
		const response = await handlers.GET({ request: new Request("http://localhost:4100/api/v1/status") });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true, data: { status: "ok" } });
	});
});
