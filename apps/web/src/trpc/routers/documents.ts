import { z } from "zod";
import { getDocument, listDocuments } from "@repo/query";
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
			const result = await (await import("../../server/document-commands")).createUpload(input, ctx.session.userId);
			return result;
		}),
	uploadSource: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), objectKey: z.string(), contentType: z.string(), content: z.string() }))
		.mutation(async ({ input }) => {
			return (await import("../../server/document-commands")).uploadSource(input);
		}),
	confirmUpload: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			return (await import("../../server/document-commands")).confirmUpload(input, ctx.session.userId);
		}),
	submit: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string(), idempotencyKey: z.string().min(8) }))
		.mutation(({ input, ctx }) => import("../../server/document-commands").then(({ submit }) => submit(input, ctx.session.userId))),
	list: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), size: z.number().int().min(1).max(100).default(25), after: z.string().optional() }))
		.query(({ input, ctx }) => listDocuments(scope(input, ctx.session.userId), input)),
	detail: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string() }))
		.query(({ input, ctx }) => getDocument(scope(input, ctx.session.userId), input.documentId)),
});
