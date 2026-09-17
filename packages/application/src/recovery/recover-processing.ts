import { prisma } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function recoverProcessing(input: { limit?: number }, db: any = prisma) {
	const runs = await db.processingRun.findMany({
		where: {
			status: { in: ["QUEUED", "VALIDATING", "ANALYZING", "FINALIZING"] },
			OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: new Date() } }],
		},
		orderBy: { createdAt: "desc" },
		take: input.limit ?? 100,
	});
	for (const run of runs) {
		const contract =
			run.status === "QUEUED"
				? "document.validate.v1"
				: run.status === "VALIDATING"
					? "document.validate.v1"
					: run.status === "ANALYZING"
						? "document.analyze.v1"
						: "document.finalize.v1";
		await db.queueOutbox.updateMany({
			where: { workspaceId: run.workspaceId, businessId: run.id, revision: run.stageRevision, status: "PUBLISHED" },
			data: { status: "PENDING", availableAt: new Date(), claimedAt: null, publishedAt: null },
		});
		await enqueueIntent(
			{
				workspaceId: run.workspaceId,
				contract,
				businessId: run.id,
				revision: run.stageRevision,
				payload: { workspaceId: run.workspaceId, runId: run.id, revision: run.stageRevision },
			},
			db,
		);
	}
	return runs.length;
}
