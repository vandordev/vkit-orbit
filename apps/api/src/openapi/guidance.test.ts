import { expect, test } from "bun:test";

test("documents the handler documentation standard for route authors", async () => {
	const guidance = await Bun.file(new URL("../../../../.agent/api/README.md", import.meta.url)).text();

	expect(guidance).toContain("apiOperation");
	expect(guidance).toContain("operationId");
	expect(guidance).toContain("examples");
	expect(guidance).toContain("422");
	expect(guidance).toContain("task quality");
});
