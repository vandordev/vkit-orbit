import { z } from "zod";
import { getDocument, listDocuments } from "@repo/query";
import { createDocumentUpload, confirmDocumentUpload, submitProcessingRun } from "@repo/application";
import { createStorageClient } from "@repo/storage";
import { createStorageConfig } from "@repo/config";
import { router, workspaceProcedure } from "../init";

const scope = (input: { workspaceId: string }, principalId: string) => ({ workspaceId: input.workspaceId, principalId });
export const documentsRouter = router({
	createUpload: workspaceProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				title: z.string().min(1),
				contentType: z.enum(["text/plain", "text/markdown"]),
				byteSize: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await createDocumentUpload({ workspaceId: input.workspaceId, principalId: ctx.session.userId }, input);
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
		}),
	uploadSource: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), objectKey: z.string(), contentType: z.string(), content: z.string() }))
		.mutation(async ({ input }) => {
			const config = createStorageConfig(process.env);
			if (!config) throw new Error("storage is not configured");
			await createStorageClient(config).put({
				key: input.objectKey,
				contentType: input.contentType,
				body: Buffer.from(input.content, "base64"),
				contentLength: Buffer.byteLength(input.content, "base64"),
			});
			return { uploaded: true };
		}),
	confirmUpload: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const config = createStorageConfig(process.env);
			if (!config) throw new Error("storage is not configured");
			return confirmDocumentUpload(
				{ workspaceId: input.workspaceId, principalId: ctx.session.userId },
				{ documentId: input.documentId },
				createStorageClient(config),
			);
		}),
	submit: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string(), idempotencyKey: z.string().min(8) }))
		.mutation(({ input, ctx }) => submitProcessingRun({ workspaceId: input.workspaceId, principalId: ctx.session.userId }, input)),
	list: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), size: z.number().int().min(1).max(100).default(25), after: z.string().optional() }))
		.query(({ input, ctx }) => listDocuments(scope(input, ctx.session.userId), input)),
	detail: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string() }))
		.query(({ input, ctx }) => getDocument(scope(input, ctx.session.userId), input.documentId)),
});
