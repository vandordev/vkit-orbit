import { prisma } from "@repo/database";
import { writeAuditLog } from "../audit/write-audit-log";
import { executeIdempotent } from "../idempotency/execute-idempotent";
import { enqueueIntent } from "../outbox/enqueue-intent";
export function submitProcessingRun(
	scope: { workspaceId: string; principalId: string },
	input: { documentId: string; idempotencyKey: string },
	db: any = prisma,
) {
	return executeIdempotent(
		scope,
		"submit-processing",
		input.idempotencyKey,
		{ documentId: input.documentId },
		async (tx) => {
			const document = await tx.document.findFirst({ where: { workspaceId: scope.workspaceId, id: input.documentId } });
			if (!document) throw new Error("document not found");
			if (document.status !== "READY") throw new Error("document is not ready");
			const revision = (await tx.processingRun.count({ where: { workspaceId: scope.workspaceId, documentId: document.id } })) + 1;
			const run = await tx.processingRun.create({
				data: { id: `run_${crypto.randomUUID()}`, workspaceId: scope.workspaceId, documentId: document.id, revision },
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
					action: "processing.submitted",
					resourceType: "processing_run",
					resourceId: run.id,
				},
				tx,
			);
			return run;
		},
		db,
	);
}
