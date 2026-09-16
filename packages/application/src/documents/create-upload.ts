import { prisma } from "@repo/database";
import { sourceObjectKey } from "@repo/storage";
import { writeAuditLog } from "../audit/write-audit-log";
import { assertSupportedUpload } from "./state-machine";

export async function createDocumentUpload(
	scope: { workspaceId: string; principalId: string },
	input: { documentId?: string; artifactId?: string; title: string; contentType: string; byteSize: number },
	db: any = prisma,
) {
	assertSupportedUpload(input.contentType, input.byteSize);
	const documentId = input.documentId ?? `doc_${crypto.randomUUID()}`;
	const artifactId = input.artifactId ?? `art_${crypto.randomUUID()}`;
	return db.$transaction(async (tx: any) => {
		const document = await tx.document.create({
			data: {
				id: documentId,
				workspaceId: scope.workspaceId,
				title: input.title,
				contentType: input.contentType,
				byteSize: input.byteSize,
			},
		});
		const artifact = await tx.documentArtifact.create({
			data: {
				id: artifactId,
				workspaceId: scope.workspaceId,
				documentId,
				kind: "SOURCE",
				objectKey: sourceObjectKey({ workspaceId: scope.workspaceId, documentId, artifactId }),
				contentType: input.contentType,
				byteSize: input.byteSize,
			},
		});
		await writeAuditLog(
			{
				workspaceId: scope.workspaceId,
				principalId: scope.principalId,
				action: "document.upload.created",
				resourceType: "document",
				resourceId: documentId,
			},
			tx,
		);
		return { document, artifact };
	});
}
