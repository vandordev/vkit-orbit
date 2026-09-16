import type { RedisConfig } from "@repo/config";
import type { Queue } from "bullmq";
import { Queue as BullQueue } from "bullmq";
import type { RedisOptions } from "ioredis";
import { queueDefaults } from "./defaults";
import type { QueueName } from "./queues";

export function createWorkerConnection(
	config: RedisConfig = { url: "redis://localhost:6379", keyPrefix: "dph:", connectTimeoutMs: 5_000, maxRetriesPerRequest: null },
): RedisOptions {
	const url = new URL(config.url);
	return {
		host: url.hostname,
		port: Number(url.port || 6379),
		username: url.username || undefined,
		password: url.password || undefined,
		db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
		connectTimeout: config.connectTimeoutMs,
		maxRetriesPerRequest: null,
	};
}

export function createQueue(name: QueueName, config?: RedisConfig): Queue {
	return new BullQueue(name, {
		connection: createWorkerConnection(config),
		prefix: config?.keyPrefix ?? "dph:",
		defaultJobOptions: queueDefaults,
	});
}

export type WorkerConnection = ReturnType<typeof createWorkerConnection>;
