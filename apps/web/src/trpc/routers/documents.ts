import { z } from "zod";
import { getDocument, listDocuments } from "@repo/query";
import { router, workspaceProcedure } from "../init";

const scope = (input: { workspaceId: string }, principalId: string) => ({ workspaceId: input.workspaceId, principalId });
export const documentsRouter = router({
	list: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), size: z.number().int().min(1).max(100).default(25), after: z.string().optional() }))
		.query(({ input, ctx }) => listDocuments(scope(input, ctx.session.userId), input)),
	detail: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), documentId: z.string() }))
		.query(({ input, ctx }) => getDocument(scope(input, ctx.session.userId), input.documentId)),
});
