import { prisma } from "@repo/database";
import { writeAuditLog } from "../audit/write-audit-log";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function retryProcessingRun(scope: { workspaceId: string; principalId: string }, runId: string, db: any = prisma) {
	return db.$transaction(async (tx: any) => {
		const old = await tx.processingRun.findFirst({ where: { workspaceId: scope.workspaceId, id: runId } });
		if (!old) throw new Error("run not found");
		if (old.status !== "FAILED") throw new Error("only failed runs can be retried");
		const run = await tx.processingRun.create({
			data: { id: `run_${crypto.randomUUID()}`, workspaceId: scope.workspaceId, documentId: old.documentId, revision: old.revision + 1 },
		});
		await enqueueIntent(
			{
				workspaceId: scope.workspaceId,
				contract: "document.validate.v1",
				businessId: run.id,
				revision: run.stageRevision,
				payload: { workspaceId: scope.workspaceId, runId: run.id, revision: run.stageRevision },
			},
			tx,
		);
		await writeAuditLog(
			{
				workspaceId: scope.workspaceId,
				principalId: scope.principalId,
				action: "processing.retried",
				resourceType: "processing_run",
				resourceId: run.id,
			},
			tx,
		);
		return run;
	});
}
