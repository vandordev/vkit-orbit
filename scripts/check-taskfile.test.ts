import { expect, test } from "bun:test";

test("documents TanStack Start embedded Elysia and Go River worker", async () => {
	const readme = await Bun.file("README.md").text();
	expect(readme).toContain("TanStack Start");
	expect(readme).toContain("embedded Elysia");
	expect(readme).toContain("Go/River");
	expect(readme).not.toContain("Next.js");
	expect(readme).not.toContain("pg-boss");
});
