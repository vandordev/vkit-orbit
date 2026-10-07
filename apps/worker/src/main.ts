import { createRedisConfig, createWorkerConfig, resolvedConfigEnvironment } from "@repo/config";
import { prisma, type DatabaseClient } from "@repo/database";
import { createQueue, queueNames, type QueueName } from "@repo/queue";
import { createStorageClient, resultObjectKey } from "@repo/storage";
import { createHash } from "node:crypto";
import { createWorkerRuntime } from "./runtime";
import { runOutboxRelay, startRelayLoop } from "./relay/loop";
import { createHealthServer } from "./server";
import { log } from "./logger";
import { createDocumentValidateHandler } from "./handlers/document-validate-v1";
import { createDocumentAnalyzeHandler } from "./handlers/document-analyze-v1";
import { createDocumentFinalizeHandler } from "./handlers/document-finalize-v1";
import { createDocumentRecoverHandler } from "./handlers/document-recover-v1";
import { createDocumentCleanupHandler } from "./handlers/document-cleanup-v1";
import { createNotificationPublishHandler } from "./handlers/notification-publish-v1";
import { createWebhookDeliverHandler } from "./handlers/webhook-deliver-v1";
import { createMaintenanceHandlers } from "./handlers/maintenance-v1";
import { createShutdown } from "./shutdown";

type Storage = ReturnType<typeof createStorageClient>;

export function createRuntimeHandlers(input: {
	database: DatabaseClient;
	storage: Storage;
	publish: (payload: unknown) => Promise<void>;
	deliver: (deliveryId: string) => Promise<number | "network">;
}) {
	return {
		...createDocumentHandlers(input.database, input.storage),
		...createMaintenanceHandlers(input.database),
		"document.recover.v1": createDocumentRecoverHandler(input.database),
		"document.cleanup.v1": createDocumentCleanupHandler(input.database),
		"notification.publish.v1": createNotificationPublishHandler(input.publish),
		"webhook.deliver.v1": createWebhookDeliverHandler(input.database, input.deliver),
	};
}

export function createDocumentHandlers(db: any, storage: Storage) {
	const readContent = async (runId: string) => {
		const run = await db.processingRun.findFirst({
			where: { id: runId },
			include: { document: { include: { artifacts: { where: { kind: "SOURCE" } } } } },
		});
		const source = run?.document?.artifacts?.[0];
		if (!source) throw new Error("source artifact not found");
		const object = (await storage.get(source.objectKey)) as { Body?: { transformToByteArray?: () => Promise<Uint8Array> } };
		if (!object.Body?.transformToByteArray) throw new Error("source object has no readable body");
		return new TextDecoder().decode(await object.Body.transformToByteArray());
	};
	const makeArtifact = async (runId: string) => {
		const run = await db.processingRun.findFirst({ where: { id: runId }, include: { document: true } });
		if (!run) throw new Error("processing run not found");
		const body = Buffer.from(JSON.stringify(run.result ?? {}));
		const id = `art_${crypto.randomUUID()}`;
		const objectKey = resultObjectKey({ workspaceId: run.workspaceId, documentId: run.documentId, runId, artifactId: id });
		await storage.put({ key: objectKey, contentType: "application/json", body, contentLength: body.length });
		return {
			id,
			documentId: run.documentId,
			objectKey,
			contentType: "application/json",
			byteSize: body.length,
			checksum: createHash("sha256").update(body).digest("hex"),
		};
	};
	return {
		"document.validate.v1": createDocumentValidateHandler(db),
		"document.analyze.v1": createDocumentAnalyzeHandler(db, readContent),
		"document.finalize.v1": createDocumentFinalizeHandler(db, makeArtifact),
	};
}

if (import.meta.main) {
	const environment = { ...process.env, ...resolvedConfigEnvironment(["base", "redis", "storage", "worker"]) };
	const config = createWorkerConfig(environment);
	const storageConfig = config.storage;
	if (!storageConfig) throw new Error("storage is not configured");
	const redisConfig = createRedisConfig(environment);
	const storage = createStorageClient(storageConfig);
	const queues = Object.fromEntries(Object.values(queueNames).map((name) => [name, createQueue(name, redisConfig)])) as Record<
		QueueName,
		ReturnType<typeof createQueue>
	>;
	const handlers = createRuntimeHandlers({
		database: prisma,
		storage,
		publish: async (payload) => {
			const { eventId, workspaceId } = payload as { eventId: string; workspaceId: string };
			const event = await prisma.auditLog.findUnique({ where: { workspaceId_id: { workspaceId, id: eventId } } });
			if (!event || event.action !== "processing.completed") throw new Error("Notification event unavailable");
			const response = await fetch(config.WORKER_NOTIFICATION_URL, {
				method: "POST",
				headers: { "content-type": "application/json", "x-worker-notification-key": config.WORKER_NOTIFICATION_API_KEY },
				body: JSON.stringify(event.metadata),
				signal: AbortSignal.timeout(5000),
			});
			if (!response.ok) throw new Error("worker notification unavailable");
		},
		deliver: async (deliveryId) => {
			const { sendStoredWebhook } = await import("./webhook-http");
			return sendStoredWebhook(prisma, deliveryId);
		},
	});
	const workers = Object.values(queueNames).map((queueName) => createWorkerRuntime({ handlers, queueName, config: redisConfig }));
	const stopRelay = startRelayLoop(() => runOutboxRelay({ queue: queues.documents, queues, db: prisma }));
	let closing = false;
	const health = createHealthServer({ isReady: () => !closing && workers.every((worker) => worker.isRunning()) });
	health.listen();
	const shutdown = createShutdown(
		() => prisma.$disconnect(),
		async () => {
			closing = true;
			await stopRelay();
			await Promise.all(workers.map((worker) => worker.close()));
			await Promise.all(Object.values(queues).map((queue) => queue.close()));
			await new Promise<void>((resolve, reject) => health.server.close((error) => (error ? reject(error) : resolve())));
		},
	);
	for (const signal of ["SIGINT", "SIGTERM"] as const)
		process.once(signal, () => {
			void shutdown().catch(() => {
				process.exitCode = 1;
			});
		});
	log("info", { service: "worker", environment: config.NODE_ENV }, "worker started");
}
