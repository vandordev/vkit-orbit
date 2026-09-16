import { prisma } from "@repo/database";
import type { Stage } from "./types";

const expected: Record<Stage, string> = { VALIDATING: "QUEUED", ANALYZING: "ANALYZING", FINALIZING: "FINALIZING" };
export async function claimStage(
	input: { workspaceId: string; runId: string; revision: number; stage: Stage; leaseMs?: number },
	db: any = prisma,
) {
	const now = new Date();
	const result = await db.processingRun.updateMany({
		where: {
			workspaceId: input.workspaceId,
			id: input.runId,
			revision: input.revision,
			status: expected[input.stage],
			OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
		},
		data: { status: input.stage, leaseExpiresAt: new Date(now.getTime() + (input.leaseMs ?? 60_000)) },
	});
	return result.count === 1;
}
