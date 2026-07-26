import { expect, test } from "bun:test";
import { t } from "elysia";

import { defineCollection, enumFilter } from "./definition";
import { collectionEnvelope, createCollectionResponse } from "./response";

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

test("creates canonical relative collection navigation links", () => {
	const result = createCollectionResponse(
		orders,
		{
			items: [{ id: "ord_1" }],
			hasNextPage: true,
			hasPreviousPage: false,
			startPosition: { createdAt: "2026-01-02T00:00:00.000Z", id: "ord_1" },
			endPosition: { createdAt: "2026-01-02T00:00:00.000Z", id: "ord_1" },
		},
		"http://localhost:4100/api/v1/orders?filter[status]=paid&sort=-createdAt&page[size]=10",
		"request-1",
	);

	expect(result.links).toEqual({
		self: "/api/v1/orders?page[size]=10&sort=-createdAt%2Cid&filter[status]=paid",
		next: expect.stringContaining("/api/v1/orders?page[size]=10&sort=-createdAt%2Cid&filter[status]=paid&page[after]="),
		prev: null,
	});
	expect(result.meta.page).toMatchObject({ size: 10, hasNextPage: true, hasPreviousPage: false });
});

test("uses null navigation links when no adjacent page exists", () => {
	const result = createCollectionResponse(
		orders,
		{ items: [], hasNextPage: false, hasPreviousPage: false },
		"http://localhost:4100/api/v1/orders",
		"request-1",
	);

	expect(result.links).toEqual({
		self: "/api/v1/orders?page[size]=25&sort=-createdAt%2Cid",
		next: null,
		prev: null,
	});
});

test("declares collection response metadata and links", () => {
	const schema = collectionEnvelope(t.Object({ id: t.String() }));

	expect(schema.properties.data.type).toBe("array");
	expect(schema.required).toEqual(expect.arrayContaining(["success", "data", "meta", "links"]));
	expect(schema.properties.meta.properties.requestId.type).toBe("string");
	expect(schema.properties.links.required).toEqual(expect.arrayContaining(["self", "next", "prev"]));
});
