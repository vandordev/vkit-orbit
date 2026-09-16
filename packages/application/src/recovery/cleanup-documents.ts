import { prisma } from "@repo/database";
export async function cleanupDocuments(input: { limit?: number; before: Date }, db: any = prisma) {
	const artifacts = await db.documentArtifact.findMany({
		where: { kind: "SOURCE", createdAt: { lt: input.before }, document: { status: "UPLOADING" } },
		take: input.limit ?? 100,
	});
	for (const artifact of artifacts)
		await db.documentArtifact.delete({ where: { workspaceId_id: { workspaceId: artifact.workspaceId, id: artifact.id } } });
	return artifacts.length;
}
