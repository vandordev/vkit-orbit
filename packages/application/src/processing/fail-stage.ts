import { prisma } from "@repo/database";
export async function failStage(input: { workspaceId: string; runId: string; revision: number; errorCode: string }, db: any = prisma) {
	const result = await db.processingRun.updateMany({
		where: {
			workspaceId: input.workspaceId,
			id: input.runId,
			revision: input.revision,
			status: { in: ["VALIDATING", "ANALYZING", "FINALIZING"] },
		},
		data: { status: "FAILED", errorCode: input.errorCode, leaseExpiresAt: null },
	});
	return result.count === 1;
}
