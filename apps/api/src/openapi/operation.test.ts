import { expect, test } from "bun:test";

import { apiOperation } from "./operation";

test("builds documented operation detail", () => {
	expect(
		apiOperation({
			summary: "Get API status",
			description: "Returns the current status of the versioned public API.",
			tags: ["System"],
		}),
	).toEqual({
		summary: "Get API status",
		description: "Returns the current status of the versioned public API.",
		tags: ["System"],
	});
});

test("rejects empty operation metadata", () => {
	expect(() => apiOperation({ summary: "", description: "Description", tags: ["System"] })).toThrow();
	expect(() => apiOperation({ summary: "Summary", description: "", tags: [] })).toThrow();
});
