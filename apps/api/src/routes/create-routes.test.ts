import { expect, test } from "bun:test";

import { createRoutes } from "./create-routes";

test("creates a versioned API group", async () => {
	const api = createRoutes(1).get("/probe", () => ({ ok: true }));
	const response = await api.handle(new Request("http://localhost/api/v1/probe"));

	expect(response.status).toBe(200);
});

test("rejects invalid API versions", () => {
	expect(() => createRoutes(0)).toThrow("API version must be a positive integer");
	expect(() => createRoutes(1.5)).toThrow("API version must be a positive integer");
});
