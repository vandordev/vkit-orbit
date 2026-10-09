import { getPrisma } from "@repo/db";
import { writeAuditLog } from "../audit/write-audit-log";
export async function cancelProcessingRun(scope: { workspaceId: string; principalId: string }, runId: string, db: any = getPrisma()) {
	return db.$transaction(async (tx: any) => {
		const run = await tx.processingRun.findFirst({ where: { workspaceId: scope.workspaceId, id: runId } });
		if (!run) throw new Error("run not found");
		if (["COMPLETED", "FAILED", "CANCELED"].includes(run.status)) throw new Error("invalid processing state");
		const updated = await tx.processingRun.update({ where: { id: run.id }, data: { status: "CANCELED" } });
		await writeAuditLog(
			{
				workspaceId: scope.workspaceId,
				principalId: scope.principalId,
				action: "processing.canceled",
				resourceType: "processing_run",
				resourceId: run.id,
			},
			tx,
		);
		return updated;
	});
}
