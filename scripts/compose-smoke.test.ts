import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("compose smoke is a fail-closed real-stack gate", () => {
	const script = readFileSync("scripts/compose-smoke.ts", "utf8");
	for (const required of [
		"trap",
		"health",
		"timeout",
		"process.exit(1)",
		"SKIPPED",
		"playwright",
		"compose-system-smoke.ts",
		"restart",
		"real public API",
	])
		expect(script).toContain(required);
});

test("compose smoke covers every remaining system criterion", () => {
	const script = readFileSync("apps/worker/src/compose-system-smoke.ts", "utf8");
	const recovery = readFileSync("apps/worker/src/compose-recovery-smoke.ts", "utf8");
	const browser = readFileSync("apps/web/src/app/_authenticated/app/-components/realtime-bridge.tsx", "utf8");
	const realtime = readFileSync("apps/web/src/lib/realtime.ts", "utf8");
	for (const required of ["requestBody", "signatureInput", "cross-workspace"]) expect(script).toContain(required);
	for (const required of ["FLUSHALL", "recoverProcessing"]) expect(recovery).toContain(required);
	for (const required of ["reconnect", "trpc"]) expect(browser).toContain(required);
	expect(realtime).toContain("invalidateQueries");
});

test("compose publishes only the three public ports and durable Redis", () => {
	const compose = readFileSync("docker-compose.yml", "utf8");
	const redis = readFileSync("deploy/redis/redis.conf", "utf8");
	for (const port of ["4100:4100", "4101:4101", "4102:4102"]) expect(compose).toContain(port);
	for (const forbidden of ["5432:5432", "6379:6379", "9000:9000", "4103:4103"]) expect(compose).not.toContain(forbidden);
	expect(redis).toContain("appendonly yes");
	expect(redis).toContain("appendfsync everysec");
	expect(redis).toContain("maxmemory-policy noeviction");
});
