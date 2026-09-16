import { prisma } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function completeValidation(input: { workspaceId: string; runId: string; revision: number }, db: any = prisma) {
	const run = await db.processingRun.findFirst({
		where: { workspaceId: input.workspaceId, id: input.runId, revision: input.revision, status: "VALIDATING" },
	});
	if (!run) return false;
	await db.$transaction(async (tx: any) => {
		await tx.processingRun.update({
			where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.runId } },
			data: { status: "ANALYZING", leaseExpiresAt: null },
		});
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
	});
	return true;
}
