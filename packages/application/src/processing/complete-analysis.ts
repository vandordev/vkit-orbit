import { getPrisma } from "@repo/db";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function completeAnalysis(input: { workspaceId: string; runId: string; revision: number; report: unknown }, db: any = getPrisma()) {
	const run = await db.processingRun.findFirst({
		where: { workspaceId: input.workspaceId, id: input.runId, stageRevision: input.revision, status: "ANALYZING" },
	});
	if (!run) return false;
	return db.$transaction(async (tx: any) => {
		const changed = await tx.processingRun.updateMany({
			where: { workspaceId: input.workspaceId, id: input.runId, stageRevision: input.revision, status: "ANALYZING" },
			data: { status: "FINALIZING", result: input.report, leaseExpiresAt: null },
		});
		if (changed.count !== 1) return false;
		await enqueueIntent(
			{
				workspaceId: input.workspaceId,
				contract: "document.finalize.v1",
				businessId: input.runId,
				revision: input.revision,
				payload: { workspaceId: input.workspaceId, runId: input.runId, revision: input.revision },
			},
			tx,
		);
		return true;
	});
}
