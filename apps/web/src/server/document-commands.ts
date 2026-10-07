import { createDocumentUpload, confirmDocumentUpload, submitProcessingRun, uploadDocumentSource } from "@repo/application";
import { createStorageClient } from "@repo/storage";
import { createStorageConfig } from "@repo/config";
export async function createUpload(
	input: { workspaceId: string; title: string; contentType: "text/plain" | "text/markdown"; byteSize: number },
	principalId: string,
) {
	const result = await createDocumentUpload({ workspaceId: input.workspaceId, principalId }, input);
	const config = createStorageConfig(process.env);
	if (!config) throw new Error("storage is not configured");
	return {
		...result,
		uploadUrl: await createStorageClient(config).createUploadUrl({
			workspaceId: input.workspaceId,
			documentId: result.document.id,
			artifactId: result.artifact.id,
			contentType: input.contentType,
			contentLength: input.byteSize,
		}),
	};
}
export async function uploadSource(
	input: { workspaceId: string; documentId: string; artifactId: string; content: string },
	principalId: string,
) {
	const config = createStorageConfig(process.env);
	if (!config) throw new Error("storage is not configured");
	return uploadDocumentSource({ workspaceId: input.workspaceId, principalId }, input, createStorageClient(config));
}
export async function confirmUpload(input: { workspaceId: string; documentId: string }, principalId: string) {
	const config = createStorageConfig(process.env);
	if (!config) throw new Error("storage is not configured");
	return confirmDocumentUpload(
		{ workspaceId: input.workspaceId, principalId },
		{ documentId: input.documentId },
		createStorageClient(config),
	);
}
export function submit(input: { workspaceId: string; documentId: string; idempotencyKey: string }, principalId: string) {
	return submitProcessingRun({ workspaceId: input.workspaceId, principalId }, input);
}
