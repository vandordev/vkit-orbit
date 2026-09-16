import { createDocumentUpload, confirmDocumentUpload, submitProcessingRun } from "@repo/application";
import { createStorageClient } from "@repo/storage";
import { createStorageConfig } from "@repo/config";
export async function createUpload(input: any, principalId: string) {
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
export async function uploadSource(input: any) {
	const config = createStorageConfig(process.env);
	if (!config) throw new Error("storage is not configured");
	await createStorageClient(config).put({
		key: input.objectKey,
		contentType: input.contentType,
		body: Buffer.from(input.content, "base64"),
		contentLength: Buffer.byteLength(input.content, "base64"),
	});
	return { uploaded: true };
}
export async function confirmUpload(input: any, principalId: string) {
	const config = createStorageConfig(process.env);
	if (!config) throw new Error("storage is not configured");
	return confirmDocumentUpload(
		{ workspaceId: input.workspaceId, principalId },
		{ documentId: input.documentId },
		createStorageClient(config),
	);
}
export function submit(input: any, principalId: string) {
	return submitProcessingRun({ workspaceId: input.workspaceId, principalId }, input);
}
