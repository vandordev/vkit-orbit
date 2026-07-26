import { expect, test } from "bun:test";

test("documents the collection query contract for API route authors", async () => {
	const guidance = await Bun.file(new URL("../../../../.agent/api/README.md", import.meta.url)).text();

	expect(guidance).toContain("page[size]");
	expect(guidance).toContain("page[after]");
	expect(guidance).toContain("filter[field]");
	expect(guidance).toContain("sort=-createdAt,id");
	expect(guidance).toContain("whitelist");
});
