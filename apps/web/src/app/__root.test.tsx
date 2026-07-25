import { describe, expect, test } from "bun:test";

describe("TanStack Start root route", () => {
	test("uses QueryProvider and does not retain Mantine", async () => {
		const source = await Bun.file(new URL("./__root.tsx", import.meta.url)).text();
		expect(source).toContain("QueryProvider");
		expect(source).not.toContain("MantineProvider");
		expect(source).toContain("errorComponent");
		expect(source).toContain("notFoundComponent");
		expect(source).toContain("pendingComponent");
		expect(source).toContain("GlobalError");
		expect(source).toContain("GlobalNotFound");
		expect(source).toContain("GlobalPending");
	});

	test("keeps reset and typed home navigation in the global error boundary", async () => {
		const source = await Bun.file(new URL("./-components/global-error.tsx", import.meta.url)).text();
		expect(source).toContain("reset()");
		expect(source).toContain('<Link to="/">');
	});

	test("uses the Vandor landing favicon", async () => {
		const source = await Bun.file(new URL("./__root.tsx", import.meta.url)).text();
		expect(source).toContain('{ rel: "icon", href: "/favicon.ico" }');
	});
});
