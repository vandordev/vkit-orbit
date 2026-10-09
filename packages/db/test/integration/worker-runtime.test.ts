import { expect, test } from "bun:test";
import { withPostgres } from "./harness";
import { createRuntimeHandlers } from "../../../../apps/worker/src/main";
import { createWorkerRuntime } from "../../../../apps/worker/src/runtime";
import { runOutboxRelay } from "../../../../apps/worker/src/relay/relay";
import { createQueue, type QueueName } from "@repo/queue";
import { createRedisConfig } from "@repo/config";
import { prepareDelivery, prepareWebhookEnvelope, enqueueIntent } from "@repo/application";

test("real BullMQ workers consume routed webhook and notification intents", async () => {
	const started = Bun.spawnSync(["docker", "run", "-d", "-P", "redis:7.4-alpine"]);
	if (started.exitCode !== 0) throw new Error("Disposable Redis could not start");
	const container = new TextDecoder().decode(started.stdout).trim();
	try {
		const port = new TextDecoder()
			.decode(Bun.spawnSync(["docker", "port", container, "6379/tcp"]).stdout)
			.trim()
			.split(":")
			.at(-1);
		if (!port) throw new Error("Disposable Redis port missing");
		const config = createRedisConfig({
			NODE_ENV: "test",
			REDIS_URL: `redis://127.0.0.1:${port}`,
			REDIS_KEY_PREFIX: `orbit:test:${crypto.randomUUID()}`,
		});
		await withPostgres(async (db) => {
			await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
			await db.webhookEndpoint.create({
				data: { id: "wh_one", workspaceId: "ws_one", url: "https://merchant.test", events: [], secretHash: "synthetic" },
			});
			const delivery = await prepareDelivery(
				{
					workspaceId: "ws_one",
					endpointId: "wh_one",
					eventId: "evt_one",
					...prepareWebhookEnvelope({ event: "synthetic", eventId: "evt_one", payload: {}, secret: "synthetic" }),
				},
				db,
			);
			await enqueueIntent(
				{
					workspaceId: "ws_one",
					contract: "webhook.deliver.v1",
					businessId: delivery.id,
					revision: 1,
					payload: { workspaceId: "ws_one", deliveryId: delivery.id, revision: 1 },
				},
				db,
			);
			await enqueueIntent(
				{
					workspaceId: "ws_one",
					contract: "notification.publish.v1",
					businessId: "evt_one",
					revision: 1,
					payload: { workspaceId: "ws_one", eventId: "evt_one", revision: 1 },
				},
				db,
			);
			let sent = 0;
			let published = 0;
			const handlers = createRuntimeHandlers({
				database: db,
				storage: {} as never,
				deliver: async () => {
					sent++;
					return 204;
				},
				publish: async () => {
					published++;
				},
			});
			const queues = Object.fromEntries(
				(["documents", "webhooks", "notifications"] as QueueName[]).map((name) => [name, createQueue(name, config)]),
			) as Record<QueueName, ReturnType<typeof createQueue>>;
			const workers = (["documents", "webhooks", "notifications"] as QueueName[]).map((queueName) =>
				createWorkerRuntime({ handlers, queueName, config }),
			);
			try {
				await Promise.all(workers.map((worker) => worker.waitUntilReady()));
				await runOutboxRelay({ queue: queues.documents, queues, db });
				const deadline = Date.now() + 10_000;
				while ((!sent || !published) && Date.now() < deadline) await Bun.sleep(25);
				expect(sent).toBe(1);
				expect(published).toBe(1);
				expect((await db.webhookDelivery.findUniqueOrThrow({ where: { id: delivery.id } })).status).toBe("SUCCEEDED");
			} finally {
				await Promise.all(workers.map((worker) => worker.close()));
				await Promise.all(Object.values(queues).map((queue) => queue.close()));
			}
		});
	} finally {
		Bun.spawnSync(["docker", "rm", "-f", container]);
	}
}, 60_000);
