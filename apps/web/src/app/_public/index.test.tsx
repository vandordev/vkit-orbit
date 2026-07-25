import { describe, expect, test } from "bun:test";

describe("Vkit Orbit public route", () => {
	test("is the pathless public landing route", async () => {
		const source = await Bun.file(new URL("./index.tsx", import.meta.url)).text();
		expect(source).toContain('createFileRoute("/_public/")');
		expect(source).toContain("createMetadata");
		expect(source).toContain("Vkit Orbit");
		expect(source).toContain("OrbitHero");
		expect(source).toContain("ArchitectureMap");
	});

	test("keeps the orbital visual accessible without motion", async () => {
		const hero = await Bun.file(new URL("./-components/orbit-hero.tsx", import.meta.url)).text();
		const architecture = await Bun.file(new URL("./-components/architecture-map.tsx", import.meta.url)).text();
		expect(hero).toContain("useReducedMotion");
		for (const label of ["TanStack Start", "Embedded Elysia", "Prisma", "River", "Go worker", "Realtime (optional)"]) {
			expect(architecture).toContain(label);
		}
	});
});
