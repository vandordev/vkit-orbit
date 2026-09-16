import { expect, test } from "bun:test";

test("documents the standalone API and TypeScript worker", async () => {
	const readme = await Bun.file("README.md").text();
	expect(readme).toContain("TanStack Start");
	expect(readme).toContain("standalone Elysia");
	expect(readme).toContain("TypeScript consume");
	expect(readme).not.toContain("Next.js");
	expect(readme).not.toContain("pg-boss");
});
