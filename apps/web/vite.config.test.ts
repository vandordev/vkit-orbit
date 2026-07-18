import { describe, expect, test } from "bun:test";

describe("TanStack Start web configuration", () => {
	test("uses TanStack Start with Bun Nitro output", async () => {
		const source = await Bun.file(new URL("./vite.config.ts", import.meta.url)).text();
		expect(source).toContain("tanstackStart");
		expect(source).toContain('nitro({ preset: "bun" })');
	});
});
