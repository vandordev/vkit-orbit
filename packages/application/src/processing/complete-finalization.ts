import { prisma } from "@repo/database";
export async function completeFinalization(
	input: {
		workspaceId: string;
		runId: string;
		revision: number;
		artifact: { id: string; documentId: string; objectKey: string; contentType: string; byteSize: number; checksum?: string };
	},
	db: any = prisma,
) {
	return db.$transaction(async (tx: any) => {
		const run = await tx.processingRun.findFirst({ where: { workspaceId: input.workspaceId, id: input.runId, revision: input.revision } });
		if (!run || run.status !== "FINALIZING") return false;
		await tx.documentArtifact.upsert({
			where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.artifact.id } },
			create: { ...input.artifact, workspaceId: input.workspaceId, processingRunId: input.runId, kind: "RESULT" },
			update: {},
		});
		await tx.processingRun.update({
			where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.runId } },
			data: { status: "COMPLETED", leaseExpiresAt: null },
		});
		return true;
	});
}
