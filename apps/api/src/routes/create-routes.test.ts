import { expect, test } from "bun:test";

import { defineCollection } from "../collection-query/definition";
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

test("installs collection query support for versioned routes", async () => {
	const collection = defineCollection({
		page: { defaultSize: 25, maxSize: 100 },
		sorts: { id: { description: "Sort results by identifier." } },
		defaultSort: ["id"],
		tieBreaker: "id",
		filters: {},
	});
	const api = createRoutes(1).get("/collection", ({ collection: query }) => ({ size: query.pagination.size }), { collection });

	const response = await api.handle(new Request("http://localhost/api/v1/collection?page[size]=10"));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ size: 10 });
});
