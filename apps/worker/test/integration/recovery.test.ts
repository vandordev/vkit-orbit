import { afterAll, beforeAll, expect, test } from "bun:test";
import { createQueue, documentAnalyzeV1, createJobId } from "@repo/queue";
import Redis from "ioredis";

const container = `dph-redis-test-${process.pid}`;
const config = { url: "redis://127.0.0.1:6399", keyPrefix: "dph-test:", connectTimeoutMs: 5_000, maxRetriesPerRequest: null as null };
const run = (args: string[]) => Bun.spawnSync(["docker", ...args], { stdout: "pipe", stderr: "pipe" });

beforeAll(() => {
	const result = run([
		"run",
		"--rm",
		"-d",
		"--name",
		container,
		"-p",
		"6399:6379",
		"redis:7.4-alpine",
		"redis-server",
		"--appendonly",
		"yes",
		"--appendfsync",
		"everysec",
		"--maxmemory-policy",
		"noeviction",
	]);
	if (result.exitCode !== 0) throw new Error(new TextDecoder().decode(result.stderr));
}, 30_000);
afterAll(() => {
	run(["rm", "-f", container]);
}, 30_000);

test("reconstructs a deterministic job after a complete Redis flush and restart", async () => {
	const queue = createQueue("documents", config);
	const redis = new Redis(config.url);
	const jobId = createJobId(documentAnalyzeV1, "run_recovery", 1);
	await queue.client;
	await queue.add(documentAnalyzeV1.name, { workspaceId: "ws", runId: "run_recovery", revision: 1 }, { jobId });
	await redis.flushall();
	run(["restart", container]);
	await queue.add(documentAnalyzeV1.name, { workspaceId: "ws", runId: "run_recovery", revision: 1 }, { jobId });
	expect(await queue.getJob(jobId)).not.toBeNull();
	await queue.close();
	await redis.quit();
});
