import { expect, test } from "bun:test";
import { getPublicWebConfig, loadPublicWebConfig } from "./runtime";
import { readFileSync } from "node:fs";
test("process getter reuses one process snapshot while pure loaders are isolated", () => {
	expect(getPublicWebConfig()).toBe(getPublicWebConfig());
	expect(loadPublicWebConfig({ environment: { REALTIME_URL: "https://one.test" } }).realtimeUrl).toBe("https://one.test");
	expect(loadPublicWebConfig({ environment: { REALTIME_URL: "https://two.test" } }).realtimeUrl).toBe("https://two.test");
});
test("public import closure is schema-only and deployment roots are explicit", () => {
	const source = readFileSync(new URL("./public.ts", import.meta.url), "utf8");
	expect(source).not.toMatch(/node:fs|process\.env|\.\/runtime|\.\/server/);
	const launcher = readFileSync(new URL("./run.ts", import.meta.url), "utf8");
	expect(launcher).toContain("--no-env-file");
	expect(launcher).toContain("ORBIT_APPLICATION_ROOT");
});
