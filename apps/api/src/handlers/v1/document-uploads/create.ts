import { Elysia, t } from "elysia";
import { createDocumentUpload } from "@repo/application";
import { createStorageClient } from "@repo/storage";
import { env } from "../../../lib/env";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

const body = t.Object(
	{
		title: t.String({ minLength: 1, description: "Document title.", examples: ["Readme"] }),
		contentType: t.String({
			pattern: "^text/(plain|markdown)$",
			description: "Supported source media type: text/plain or text/markdown.",
			examples: ["text/markdown"],
		}),
		byteSize: t.Integer({ minimum: 1, description: "Expected source byte length.", examples: [128] }),
	},
	{ description: "Document upload metadata.", examples: [{ title: "Readme", contentType: "text/markdown", byteSize: 128 }] },
);

export const createDocumentUploadHandler = new Elysia().post(
	"/document-uploads",
	async ({ body: input, request }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:write");
		const result = await createDocumentUpload({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, input);
		if (!env.storage) throw new Error("storage is not configured");
		const storage = createStorageClient(env.storage);
		return {
			success: true as const,
			data: {
				document: result.document,
				artifact: result.artifact,
				uploadUrl: await storage.createUploadUrl({
					workspaceId: principal!.workspaceId,
					documentId: result.document.id,
					artifactId: result.artifact.id,
					contentType: input.contentType,
					contentLength: input.byteSize,
				}),
			},
		};
	},
	{
		body,
		response: successEnvelope(
			t.Object(
				{
					document: t.Object({}, { additionalProperties: true, description: "Created document.", examples: [{ id: "doc_1" }] }),
					artifact: t.Object({}, { additionalProperties: true, description: "Created source artifact.", examples: [{ id: "art_1" }] }),
					uploadUrl: t.String({ description: "Short-lived signed upload URL.", examples: ["https://storage.test/upload"] }),
				},
				{
					description: "Document upload response.",
					examples: [{ document: { id: "doc_1" }, artifact: { id: "art_1" }, uploadUrl: "https://storage.test/upload" }],
				},
			),
			{
				description: "Document upload created.",
				example: {
					success: true,
					data: { document: { id: "doc_1" }, artifact: { id: "art_1" }, uploadUrl: "https://storage.test/upload" },
				},
			},
		),
		detail: apiOperation({
			summary: "Create a document upload",
			description: "Creates a workspace-scoped document and returns a signed source upload URL.",
			tags: ["Documents"],
		}),
	},
);
