import { Elysia, t } from "elysia";
import { submitProcessingRun } from "@repo/application";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const submitProcessingRunHandler = new Elysia().post(
	"/documents/:documentId/processing-runs",
	async ({ params, request }) => {
		const principal = await authenticatedPrincipal(request);
		const idempotencyKey = request.headers.get("idempotency-key");
		requireApiScope(principal, "documents:write");
		if (!idempotencyKey) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
		const data = await submitProcessingRun(
			{ workspaceId: principal!.workspaceId, principalId: principal!.userId },
			{ documentId: params.documentId, idempotencyKey },
		);
		return { success: true as const, data };
	},
	{
		params: t.Object({ documentId: t.String({ description: "Document identifier.", examples: ["doc_1"] }) }),
		headers: t.Object({
			"idempotency-key": t.String({
				minLength: 8,
				description: "Stable key for safely replaying this command.",
				examples: ["submit-doc-1"],
			}),
		}),
		response: successEnvelope(
			t.Object({}, { additionalProperties: true, description: "Created processing run.", examples: [{ id: "run_1", status: "QUEUED" }] }),
			{ description: "Processing run response.", example: { success: true, data: { id: "run_1", status: "QUEUED" } } },
		),
		detail: apiOperation({
			summary: "Start document processing",
			description: "Creates one idempotent processing run for a ready document.",
			tags: ["Processing"],
		}),
	},
);
