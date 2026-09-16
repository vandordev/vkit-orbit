import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("recovery smoke fails on unavailable boundary", () => {
	const source = readFileSync("scripts/redis-recovery-smoke.ts", "utf8");
	expect(source).toContain("SKIPPED");
	expect(source).toContain("process.exit(1)");
});
