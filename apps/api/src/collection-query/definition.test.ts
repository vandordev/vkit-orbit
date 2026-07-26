import { expect, test } from "bun:test";

import { dateRangeFilter, defineCollection, enumFilter } from "./definition";

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
		createdAt: dateRangeFilter({
			description: "Limit orders by creation timestamp.",
		}),
	},
	search: { description: "Searches order reference and customer name." },
});

test("parses a declared cursor collection query", () => {
	const query = orders.parse({
		"page[size]": 10,
		sort: "-createdAt",
		"filter[status]": "paid",
		"filter[createdAt][gte]": "2026-01-01T00:00:00.000Z",
		q: "invoice",
	});

	expect(query).toEqual({
		pagination: { type: "cursor", size: 10 },
		sort: [
			{ field: "createdAt", direction: "desc" },
			{ field: "id", direction: "asc" },
		],
		filters: {
			status: "paid",
			createdAt: { gte: new Date("2026-01-01T00:00:00.000Z") },
		},
		search: "invoice",
	});
});

test("rejects page size above the declared maximum", () => {
	expect(() => orders.parse({ "page[size]": 101 })).toThrow();
});

test("rejects undeclared sort fields", () => {
	expect(() => orders.parse({ sort: "customerEmail" })).toThrow();
});

test("rejects both cursor directions", () => {
	expect(() => orders.parse({ "page[after]": "a", "page[before]": "b" })).toThrow();
});
