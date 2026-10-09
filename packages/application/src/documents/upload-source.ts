import { prisma, type DatabaseClient } from "@repo/db";
import type { PutObjectInput } from "@repo/storage";
import { requirePermission } from "../auth/permissions";
import { ForbiddenError, NotFoundError } from "../shared/errors";
import { assertSupportedUpload } from "./state-machine";

export async function uploadDocumentSource(
	scope: { workspaceId: string; principalId: string },
	input: { documentId: string; artifactId: string; content: string },
	storage: { put(input: PutObjectInput): Promise<unknown> },
	db: DatabaseClient = prisma,
) {
	const member = await db.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId: scope.workspaceId, userId: scope.principalId } },
		select: { role: true },
	});
	if (!member) throw new ForbiddenError("Workspace access denied");
	requirePermission(member.role, "documents:write");
	const artifact = await db.documentArtifact.findFirst({
		where: { workspaceId: scope.workspaceId, id: input.artifactId, documentId: input.documentId, kind: "SOURCE" },
		include: { document: { select: { status: true } } },
	});
	if (!artifact) throw new NotFoundError("source artifact not found");
	if (artifact.document.status !== "UPLOADING") throw new Error("document is already ready");
	assertSupportedUpload(artifact.contentType, artifact.byteSize);
	if (
		input.content.length > Math.ceil(artifact.byteSize / 3) * 4 ||
		!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.content)
	) {
		throw new Error("invalid source size or base64 encoding");
	}
	const body = Buffer.from(input.content, "base64");
	if (body.length !== artifact.byteSize) throw new Error("source size does not match");
	await storage.put({ key: artifact.objectKey, contentType: artifact.contentType, body, contentLength: body.length });
	return { uploaded: true as const };
}
