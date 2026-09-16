import { Elysia, t } from "elysia";
import { listDocuments } from "@repo/query";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const listDocumentsHandler = new Elysia().get(
	"/documents",
	async ({ query, request }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:read");
		return {
			success: true as const,
			data: await listDocuments(
				{ workspaceId: principal!.workspaceId, principalId: principal!.userId },
				{ size: query.size ?? 25, after: query.after },
			),
		};
	},
	{
		query: t.Object(
			{
				size: t.Optional(t.Integer({ minimum: 1, maximum: 100, description: "Maximum documents to return.", examples: [25] })),
				after: t.Optional(t.String({ description: "Opaque cursor from a previous page.", examples: ["doc_1"] })),
			},
			{ description: "Document collection pagination.", examples: [{ size: 25 }] },
		),
		response: successEnvelope(
			t.Array(
				t.Object({}, { additionalProperties: true, description: "Document summary.", examples: [{ id: "doc_1", status: "READY" }] }),
				{ description: "Document list data.", examples: [[{ id: "doc_1", status: "READY" }]] },
			),
			{ description: "Document collection response.", example: { success: true, data: [{ id: "doc_1", status: "READY" }] } },
		),
		detail: apiOperation({
			summary: "List documents",
			description: "Lists documents belonging to the authenticated API key workspace.",
			tags: ["Documents"],
		}),
	},
);
