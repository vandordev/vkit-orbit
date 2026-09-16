import { Elysia, t } from "elysia";
import { getDocument } from "@repo/query";
import { apiOperation } from "../../../openapi/operation";
import { failureEnvelope, successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const getDocumentHandler = new Elysia().get(
	"/documents/:documentId",
	async ({ params, request, set }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:read");
		const data = await getDocument({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, params.documentId);
		if (!data) set.status = 404;
		return data
			? { success: true as const, data }
			: { success: false as const, error: "NOT_FOUND" as const, message: "Document not found" };
	},
	{
		params: t.Object({ documentId: t.String({ description: "Document identifier.", examples: ["doc_1"] }) }),
		response: {
			200: successEnvelope(t.Object({}, { additionalProperties: true, description: "Document detail.", examples: [{ id: "doc_1" }] }), {
				description: "Document detail response.",
				example: { success: true, data: { id: "doc_1" } },
			}),
			404: failureEnvelope({
				description: "Document not found.",
				example: { success: false, error: "NOT_FOUND", message: "Document not found" },
			}),
		},
		detail: apiOperation({
			summary: "Get a document",
			description: "Returns one document only when it belongs to the API key workspace.",
			tags: ["Documents"],
		}),
	},
);
