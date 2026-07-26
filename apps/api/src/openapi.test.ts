import { expect, test } from "bun:test";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { resolvedConfigEnvironment } from "../../../packages/config/src/run";
import { collectionQueryPlugin } from "./collection-query/plugin";
import { defineCollection, enumFilter } from "./collection-query/definition";
import { validateOpenApiDocumentation } from "./openapi/contract";

async function getApp() {
	Object.assign(process.env, resolvedConfigEnvironment(["base", "api"], { DATABASE_URL: "postgresql://db", NODE_ENV: "test" }));
	return (await import("./app")).app;
}

test("serves generated OpenAPI JSON", async () => {
	const app = await getApp();
	const response = await app.handle(new Request("http://localhost:4100/api/openapi.json"));

	expect(response.status).toBe(200);
	const document = await response.json();
	expect(document.openapi).toMatch(/^3\./);
	expect(document.servers).toEqual([{ url: "http://localhost:4100" }]);
	expect(document.paths["/api/v1/status"]).toBeDefined();
	expect(document.paths["/api/internal/worker-events"]).toBeUndefined();
});

test("documents every visible baseline handler", async () => {
	const app = await getApp();
	const response = await app.handle(new Request("http://localhost:4100/api/openapi.json"));
	const document = await response.json();
	const operations = [document.paths["/api/v1/status"].get, document.paths["/health/"].get, document.paths["/health/ready"].get];

	for (const operation of operations) {
		expect(operation.operationId).toEqual(expect.any(String));
		expect(operation.summary).toEqual(expect.any(String));
		expect(operation.description).toEqual(expect.any(String));
		expect(operation.tags).toEqual(expect.any(Array));
	}

	const statusResponse = document.paths["/api/v1/status"].get.responses["200"];
	expect(statusResponse.description).toEqual(expect.any(String));
	expect(statusResponse.content["application/json"].schema.examples).toEqual([{ success: true, data: { status: "ok" } }]);
});

test("meets the generated OpenAPI documentation contract", async () => {
	const app = await getApp();
	const response = await app.handle(new Request("http://localhost:4100/api/openapi.json"));

	expect(validateOpenApiDocumentation(await response.json())).toEqual([]);
});

test("serves Scalar documentation", async () => {
	const app = await getApp();
	const response = await app.handle(new Request("http://localhost:4101/api/docs"));

	expect(response.status).toBe(200);
	expect(await response.text()).toContain('"url":"/api/openapi.json"');
});

test("documents declared collection query parameters", async () => {
	const orders = defineCollection({
		page: { defaultSize: 25, maxSize: 100 },
		sorts: {
			createdAt: { description: "Sort orders by creation time." },
			id: { description: "Sort orders by identifier." },
		},
		defaultSort: ["-createdAt"],
		tieBreaker: "id",
		filters: {
			status: enumFilter(["draft", "paid", "cancelled"], {
				description: "Return orders with the given lifecycle status.",
			}),
		},
		search: { description: "Searches order reference and customer name." },
	});
	const app = new Elysia()
		.use(openapi({ path: "/docs", specPath: "/openapi.json", provider: null }))
		.use(collectionQueryPlugin)
		.get("/orders", () => ({ success: true }), { collection: orders });

	const response = await app.handle(new Request("http://localhost/openapi.json"));
	const document = await response.json();
	const parameters = document.paths["/orders"].get.parameters;

	expect(parameters).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				name: "page[size]",
				in: "query",
				schema: expect.objectContaining({ description: "Maximum number of items to return." }),
			}),
			expect.objectContaining({
				name: "page[after]",
				in: "query",
				schema: expect.objectContaining({ description: "Opaque cursor that continues forward from a previous response." }),
			}),
			expect.objectContaining({
				name: "filter[status]",
				in: "query",
				schema: expect.objectContaining({ description: "Return orders with the given lifecycle status." }),
			}),
			expect.objectContaining({
				name: "q",
				in: "query",
				schema: expect.objectContaining({ description: "Searches order reference and customer name." }),
			}),
		]),
	);
	expect(parameters).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: "filter[customerEmail]" })]));
});
