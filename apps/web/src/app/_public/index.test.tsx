import { describe, expect, test } from "bun:test";

describe("Vkit Orbit public route", () => {
	test("is the pathless public landing route", async () => {
		const source = await Bun.file(new URL("./index.tsx", import.meta.url)).text();
		expect(source).toContain('createFileRoute("/_public/")');
		expect(source).toContain("createMetadata");
		expect(source).toContain("appConfig.defaultDescription");
		expect(source).toContain("appConfig.appName");
		expect(source).toContain("OrbitHero");
		expect(source).toContain("ArchitectureMap");
	});

	test("uses the configured repository URL in the public header", async () => {
		const source = await Bun.file(new URL("./-components/public-header.tsx", import.meta.url)).text();
		expect(source).toContain("appConfig.repositoryUrl");
	});

	test("keeps the orbital visual accessible without motion", async () => {
		const hero = await Bun.file(new URL("./-components/orbit-hero.tsx", import.meta.url)).text();
		const earth = await Bun.file(new URL("./-components/rotating-earth.tsx", import.meta.url)).text();
		const architecture = await Bun.file(new URL("./-components/architecture-map.tsx", import.meta.url)).text();
		expect(hero).toContain("RotatingEarth");
		expect(earth).toContain("useReducedMotion");
		expect(earth).toContain("canvas");
		expect(earth).toContain("d3");
		expect(earth).toContain("aspect-square");
		expect(earth).toContain("containerSize");
		for (const label of ["TanStack Start", "Embedded Elysia", "Prisma", "River", "Go worker", "Realtime (optional)"]) {
			expect(architecture).toContain(label);
		}
	});
});
