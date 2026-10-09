import { Elysia, t } from "elysia";
import { confirmDocumentUpload } from "@repo/application";
import { createStorageClient } from "@repo/storage";
import { getEnv } from "../../../lib/env";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const confirmDocumentUploadHandler = new Elysia().post(
	"/documents/:documentId/upload-confirmations",
	async ({ params, request }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:write");
		const config = getEnv().storage;
		if (!config) throw new Error("storage is not configured");
		const storage = createStorageClient(config);
		const data = await confirmDocumentUpload(
			{ workspaceId: principal!.workspaceId, principalId: principal!.userId },
			{ documentId: params.documentId },
			storage,
		);
		return { success: true as const, data };
	},
	{
		params: t.Object({ documentId: t.String({ description: "Document identifier.", examples: ["doc_01JQZ3HAP4D77YQ58D7T"] }) }),
		response: successEnvelope(
			t.Object({}, { additionalProperties: true, description: "Confirmed document.", examples: [{ id: "doc_1", status: "READY" }] }),
			{ description: "Upload confirmation response.", example: { success: true, data: { id: "doc_1", status: "READY" } } },
		),
		detail: apiOperation({
			summary: "Confirm a document upload",
			description: "Confirms that the source object exists and makes the document ready for processing.",
			tags: ["Documents"],
		}),
	},
);
