import { describe, expect, test } from "bun:test";

describe("TanStack Start root route", () => {
	test("uses QueryProvider and does not retain Mantine", async () => {
		const source = await Bun.file(new URL("./__root.tsx", import.meta.url)).text();
		expect(source).toContain("QueryProvider");
		expect(source).not.toContain("MantineProvider");
	});
});
