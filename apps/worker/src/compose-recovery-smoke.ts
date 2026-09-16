import { randomBytes } from "node:crypto";
import { prisma } from "@repo/database";
import { recoverProcessing } from "@repo/application";
import { createQueue, createJobId, documentAnalyzeV1 } from "@repo/queue";

const suffix = randomBytes(8).toString("hex");
const workspaceId = `ws_recovery_${suffix}`;
const userId = `usr_recovery_${suffix}`;
const documentId = `doc_recovery_${suffix}`;
const runId = `run_recovery_${suffix}`;
const fail = (message: string): never => {
	throw new Error(`recovery smoke: ${message}`);
};
const check: (value: unknown, message: string) => asserts value = (value, message) => {
	if (!value) fail(message);
};

await prisma.user.create({ data: { id: userId, email: `${suffix}@recovery.test`, passwordHash: "smoke" } });
await prisma.workspace.create({ data: { id: workspaceId, name: "Recovery workspace", slug: `recovery-${suffix}` } });
await prisma.workspaceMember.create({ data: { workspaceId, userId, role: "OWNER" } });
await prisma.document.create({
	data: { id: documentId, workspaceId, title: "Recovery", contentType: "text/plain", byteSize: 1, status: "READY" },
});
await prisma.processingRun.create({
	data: { id: runId, workspaceId, documentId, revision: 1, status: "ANALYZING", stageRevision: 7, leaseExpiresAt: new Date(0) },
});
await prisma.queueOutbox.create({
	data: {
		id: `outbox_${suffix}`,
		workspaceId,
		contract: "document.analyze.v1",
		businessId: runId,
		revision: 7,
		payload: { workspaceId, runId, revision: 7 },
		status: "PUBLISHED",
		publishedAt: new Date(),
	},
});

const recovered = await recoverProcessing({ limit: 10 }, prisma);
check(recovered === 1, "PostgreSQL current-stage recovery did not select the run");
const pending = await prisma.queueOutbox.findFirstOrThrow({ where: { workspaceId, businessId: runId, status: "PENDING" } });
const queue = createQueue("documents");
await queue.add(documentAnalyzeV1.name, pending.payload, { jobId: createJobId(documentAnalyzeV1, runId, 7) });
check(await queue.getJob(createJobId(documentAnalyzeV1, runId, 7)), "recovery did not reconstruct the deterministic analyze job");
await queue.close();
console.info("PostgreSQL-driven current-stage reconstruction after Redis FLUSHALL passed.");
