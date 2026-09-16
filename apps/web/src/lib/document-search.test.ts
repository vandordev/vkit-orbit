import { describe, expect, test } from "bun:test";
import { documentSearchSchema } from "./document-search";

describe("document search", () => {
	test("normalizes URL-owned filters and cursor pagination", () => {
		expect(documentSearchSchema.parse({ status: "FAILED", q: "quarterly", size: "25" })).toEqual({
			status: "FAILED",
			q: "quarterly",
			size: 25,
		});
	});
});
