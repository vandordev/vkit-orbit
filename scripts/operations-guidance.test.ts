import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

describe("document hub guidance", () => {
	test("contains the complete runbook inventory and current architecture", () => {
		for (const name of [
			"redis-recovery",
			"stuck-processing",
			"webhook-delivery",
			"postgres-recovery",
			"storage-recovery",
			"incident-triage",
		]) {
			const content = readFileSync(join(root, "docs/runbooks", `${name}.md`), "utf8");
			for (const section of ["Symptoms", "Impact", "Diagnosis", "Containment", "Recovery", "Verification", "Stop conditions"]) {
				expect(content).toContain(`## ${section}`);
			}
		}
		const guidance = [readFileSync(join(root, "AGENTS.md"), "utf8"), readFileSync(join(root, "README.md"), "utf8")].join("\n");
		expect(guidance).not.toMatch(/Go\/River|Go worker|River TypeScript|embedded Elysia|\bEden\b.*browser/i);
	});
});
