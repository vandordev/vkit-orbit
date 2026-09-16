import { createRedisConfig, createStorageConfig } from "@repo/config";
import { prisma } from "@repo/database";
import { createQueue } from "@repo/queue";
import { createStorageClient, resultObjectKey } from "@repo/storage";
import { createHash } from "node:crypto";
import { createWorkerRuntime } from "./runtime";
import { runOutboxRelay, startRelayLoop } from "./relay/loop";
import { createHealthServer } from "./server";
import { log } from "./logger";
import { createDocumentValidateHandler } from "./handlers/document-validate-v1";
import { createDocumentAnalyzeHandler } from "./handlers/document-analyze-v1";
import { createDocumentFinalizeHandler } from "./handlers/document-finalize-v1";

type Storage = ReturnType<typeof createStorageClient>;

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
	const storageConfig = createStorageConfig(process.env);
	if (!storageConfig) throw new Error("storage is not configured");
	const redisConfig = createRedisConfig(process.env);
	const storage = createStorageClient(storageConfig);
	const queue = createQueue("documents", redisConfig);
	const worker = createWorkerRuntime({ handlers: createDocumentHandlers(prisma, storage), config: redisConfig });
	startRelayLoop(() => runOutboxRelay({ queue, db: prisma }));
	log("info", { service: "worker", environment: process.env.NODE_ENV ?? "development" }, "worker started");
	createHealthServer({ isReady: () => worker.isRunning() }).listen();
}
