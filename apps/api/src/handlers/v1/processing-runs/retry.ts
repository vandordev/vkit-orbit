import { Elysia, t } from "elysia";
import { retryProcessingRun } from "@repo/application";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const retryProcessingRunHandler = new Elysia().post(
	"/processing-runs/:runId/retries",
	async ({ params, request }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:write");
		return {
			success: true as const,
			data: await retryProcessingRun({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, params.runId),
		};
	},
	{
		params: t.Object({ runId: t.String({ description: "Processing run identifier.", examples: ["run_1"] }) }),
		response: successEnvelope(
			t.Object({}, { additionalProperties: true, description: "Retried processing run.", examples: [{ id: "run_1", status: "QUEUED" }] }),
			{ description: "Retry response.", example: { success: true, data: { id: "run_1", status: "QUEUED" } } },
		),
		detail: apiOperation({
			summary: "Retry processing",
			description: "Queues a failed processing run again through its durable application command.",
			tags: ["Processing"],
		}),
	},
);
