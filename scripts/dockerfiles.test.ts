import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "bun:test";

const root = join(import.meta.dir, "..");

test("ships every production runtime Dockerfile", () => {
	for (const file of [
		"Dockerfile.web",
		"Dockerfile.api",
		"Dockerfile.scheduler",
		"Dockerfile.realtime",
		"Dockerfile.worker",
		"Dockerfile.migrate",
	]) {
		expect(readFileSync(join(root, file), "utf8")).toContain("FROM");
	}
});

test("uses Bun 1.3.14 runtime bases", () => {
	expect(readFileSync(join(root, "Dockerfile.web"), "utf8")).toContain("oven/bun:1.3.14");
	expect(readFileSync(join(root, "Dockerfile.worker"), "utf8")).toContain("oven/bun:1.3.14");
});

test("keeps web runtime dependencies production-only and Prisma artifacts", () => {
	const dockerfile = readFileSync(join(root, "Dockerfile.web"), "utf8");
	expect(dockerfile).toContain("AS runtime-deps");
	expect(dockerfile).toContain("bun install --production");
	expect(dockerfile).toContain("/app/node_modules/.prisma");
});

test("limits migration image dependencies to the database workspace", () => {
	const dockerfile = readFileSync(join(root, "Dockerfile.migrate"), "utf8");
	expect(dockerfile).toContain("--filter @repo/migrate");
	expect(dockerfile).toContain("COPY packages/db/package.json packages/db/package.json");
	expect(dockerfile).not.toContain("COPY . .");
});
