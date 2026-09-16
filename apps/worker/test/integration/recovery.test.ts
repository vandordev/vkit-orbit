import { afterAll, beforeAll, expect, test } from "bun:test";
import { createQueue, documentAnalyzeV1, createJobId } from "@repo/queue";
import { submitProcessingRun, recoverProcessing } from "@repo/application";
import { withPostgres } from "../../../../packages/database/test/integration/harness";
import { runOutboxRelay } from "../../src/relay/relay";
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

test("reconstructs a persisted run after a complete Redis flush and restart", async () => {
	const queue = createQueue("documents", config);
	const redis = new Redis(config.url);
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "recovery_ws", name: "Recovery", slug: "recovery" } });
		await db.document.create({
			data: { id: "recovery_doc", workspaceId: "recovery_ws", title: "Recovery", contentType: "text/plain", byteSize: 4, status: "READY" },
		});
		const processingRun = await submitProcessingRun(
			{ workspaceId: "recovery_ws", principalId: "system" },
			{ documentId: "recovery_doc", idempotencyKey: "recovery-submit" },
			db,
		);
		await runOutboxRelay({ db, queue });
		await db.processingRun.update({
			where: { workspaceId_id: { workspaceId: "recovery_ws", id: processingRun.id } },
			data: { status: "ANALYZING", leaseExpiresAt: new Date(Date.now() - 1_000) },
		});
		await redis.flushall();
		run(["restart", container]);
		await recoverProcessing({ limit: 100 }, db);
		await runOutboxRelay({ db, queue });
		const jobId = createJobId(documentAnalyzeV1, processingRun.id, processingRun.stageRevision);
		expect(await queue.getJob(jobId)).not.toBeNull();
	});
	await queue.close();
	await redis.quit();
}, 60_000);
