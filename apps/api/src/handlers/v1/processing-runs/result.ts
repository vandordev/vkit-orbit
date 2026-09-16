import { Elysia, t } from "elysia";
import { getProcessingRun } from "@repo/query";
import { apiOperation } from "../../../openapi/operation";
import { failureEnvelope, successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const getProcessingResultHandler = new Elysia().get(
	"/processing-runs/:runId/result",
	async ({ params, request, set }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:read");
		const run = await getProcessingRun({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, params.runId);
		if (!run || run.status !== "COMPLETED") set.status = 404;
		return run && run.status === "COMPLETED"
			? { success: true as const, data: { runId: run.id, result: (run.result ?? {}) as Record<string, unknown> } }
			: { success: false as const, error: "NOT_FOUND" as const, message: "Processing result not found" };
	},
	{
		params: t.Object({ runId: t.String({ description: "Completed processing run identifier.", examples: ["run_1"] }) }),
		response: {
			200: successEnvelope(
				t.Object(
					{
						runId: t.String({ description: "Processing run identifier.", examples: ["run_1"] }),
						result: t.Record(t.String(), t.Unknown(), {
							description: "Authoritative processing result JSON.",
							examples: [{ wordCount: 10 }],
						}),
					},
					{ description: "Processing result.", examples: [{ runId: "run_1", result: { wordCount: 10 } }] },
				),
				{ description: "Processing result response.", example: { success: true, data: { runId: "run_1", result: { wordCount: 10 } } } },
			),
			404: failureEnvelope({
				description: "Processing result not found.",
				example: { success: false, error: "NOT_FOUND", message: "Processing result not found" },
			}),
		},
		detail: apiOperation({
			summary: "Get a processing result",
			description: "Returns the authoritative result JSON for a completed run.",
			tags: ["Processing"],
		}),
	},
);
