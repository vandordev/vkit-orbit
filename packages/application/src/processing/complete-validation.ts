import { prisma } from "@repo/db";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function completeValidation(input: { workspaceId: string; runId: string; revision: number }, db: any = prisma) {
	const run = await db.processingRun.findFirst({
		where: { workspaceId: input.workspaceId, id: input.runId, stageRevision: input.revision, status: "VALIDATING" },
	});
	if (!run) return false;
	return db.$transaction(async (tx: any) => {
		const changed = await tx.processingRun.updateMany({
			where: { workspaceId: input.workspaceId, id: input.runId, stageRevision: input.revision, status: "VALIDATING" },
			data: { status: "ANALYZING", leaseExpiresAt: null },
		});
		if (changed.count !== 1) return false;
		await enqueueIntent(
			{
				workspaceId: input.workspaceId,
				contract: "document.analyze.v1",
				businessId: input.runId,
				revision: input.revision,
				payload: input,
			},
			tx,
		);
		return true;
	});
}
