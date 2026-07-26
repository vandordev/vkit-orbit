import { expect, test } from "bun:test";
import { Elysia } from "elysia";

import { errorEnvelopePlugin } from "../plugins/error-envelope";
import { defineCollection, enumFilter } from "./definition";
import { collectionQueryPlugin } from "./plugin";

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
});

const app = new Elysia()
	.use(errorEnvelopePlugin)
	.use(collectionQueryPlugin)
	.get("/orders", ({ collection }) => ({ size: collection.pagination.size, sort: collection.sort }), { collection: orders });

test("resolves validated collection input into the handler context", async () => {
	const response = await app.handle(new Request("http://localhost/orders?page[size]=10&sort=-createdAt"));

	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		size: 10,
		sort: [
			{ field: "createdAt", direction: "desc" },
			{ field: "id", direction: "asc" },
		],
	});
});

test("uses the standard validation envelope for conflicting cursor directions", async () => {
	const response = await app.handle(new Request("http://localhost/orders?page[after]=a&page[before]=b"));

	expect(response.status).toBe(422);
	expect(await response.json()).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
});
