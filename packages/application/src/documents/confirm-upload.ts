import { prisma } from "@repo/database";
import { writeAuditLog } from "../audit/write-audit-log";
export async function confirmDocumentUpload(
	scope: { workspaceId: string; principalId: string },
	input: { documentId: string; revision?: number },
	storage: { head(key: string): Promise<any> },
	db: any = prisma,
) {
	return db.$transaction(async (tx: any) => {
		const document = await tx.document.findFirst({ where: { workspaceId: scope.workspaceId, id: input.documentId } });
		if (!document) throw new Error("document not found");
		if (input.revision !== undefined && input.revision !== 1) throw new Error("stale revision");
		if (document.status !== "UPLOADING") throw new Error("invalid document state");
		const artifact = await tx.documentArtifact.findFirst({
			where: { workspaceId: scope.workspaceId, documentId: document.id, kind: "SOURCE" },
		});
		if (!artifact) throw new Error("source artifact not found");
		const metadata = await storage.head(artifact.objectKey);
		if (metadata.ContentLength !== undefined && metadata.ContentLength !== document.byteSize)
			throw new Error("uploaded size does not match");
		const updated = await tx.document.update({ where: { id: document.id }, data: { status: "READY" } });
		await writeAuditLog(
			{
				workspaceId: scope.workspaceId,
				principalId: scope.principalId,
				action: "document.upload.confirmed",
				resourceType: "document",
				resourceId: document.id,
			},
			tx,
		);
		return updated;
	});
}
