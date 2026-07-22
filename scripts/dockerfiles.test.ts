import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "bun:test";

const root = join(import.meta.dir, "..");

test("ships the five runtime Dockerfiles without a standalone API image", () => {
	for (const file of ["Dockerfile.web", "Dockerfile.scheduler", "Dockerfile.realtime", "Dockerfile.worker", "Dockerfile.migrate"]) {
		expect(readFileSync(join(root, file), "utf8")).toContain("FROM");
	}
	expect(() => readFileSync(join(root, "Dockerfile.api"), "utf8")).toThrow();
});

test("uses Bun 1.3.14 and Go 1.25.7 runtime bases", () => {
	expect(readFileSync(join(root, "Dockerfile.web"), "utf8")).toContain("oven/bun:1.3.14");
	expect(readFileSync(join(root, "Dockerfile.worker"), "utf8")).toContain("golang:1.25.7");
});

test("keeps web runtime dependencies production-only and Prisma artifacts", () => {
	const dockerfile = readFileSync(join(root, "Dockerfile.web"), "utf8");
	expect(dockerfile).toContain("AS runtime-deps");
	expect(dockerfile).toContain("bun install --production");
	expect(dockerfile).toContain("/app/node_modules/.prisma");
});

test("limits migration image dependencies to the database workspace", () => {
	const dockerfile = readFileSync(join(root, "Dockerfile.migrate"), "utf8");
	expect(dockerfile).toContain("--filter @repo/database");
	expect(dockerfile).toContain("COPY packages/database/package.json packages/database/package.json");
	expect(dockerfile).not.toContain("COPY . .");
});
