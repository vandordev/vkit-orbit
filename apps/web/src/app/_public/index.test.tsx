import { describe, expect, test } from "bun:test";

describe("Vkit Orbit public route", () => {
	test("is the pathless public landing route", async () => {
		const source = await Bun.file(new URL("./index.tsx", import.meta.url)).text();
		expect(source).toContain('createFileRoute("/_public/")');
		expect(source).toContain("createMetadata");
		expect(source).toContain("appConfig.defaultDescription");
		expect(source).toContain("appConfig.appName");
		expect(source).toContain("HeroText");
	});

	test("renders the shutter text hero interaction", async () => {
		const source = await Bun.file(
			new URL("../../components/ui/hero-shutter-text.tsx", import.meta.url),
		).text();
		expect(source).toContain('text = "IMMERSE"');
		expect(source).toContain("AnimatePresence");
		expect(source).toContain("RefreshCw");
		expect(source).toContain("setCount");
	});
});
