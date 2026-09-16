import { prisma } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function completeAnalysis(input: { workspaceId: string; runId: string; revision: number; report: unknown }, db: any = prisma) {
	const run = await db.processingRun.findFirst({
		where: { workspaceId: input.workspaceId, id: input.runId, revision: input.revision, status: "ANALYZING" },
	});
	if (!run) return false;
	await db.$transaction(async (tx: any) => {
		await tx.processingRun.update({
			where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.runId } },
			data: { status: "FINALIZING", result: input.report, leaseExpiresAt: null },
		});
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
	});
	return true;
}
