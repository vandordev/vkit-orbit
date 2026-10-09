import { describe, expect, test } from "bun:test";



describe("embedded Elysia health route", () => {
	test("serves Elysia health through TanStack Start", async () => {
		const route = await import("./index");
		const response = await (route.Route as any).options.server.handlers.GET({ request: new Request("http://localhost:4100/health") });
		expect(response.status).toBe(200);
	});
});
