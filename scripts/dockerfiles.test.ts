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
