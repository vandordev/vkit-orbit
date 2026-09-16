import { Elysia, t } from "elysia";
import { getProcessingRun } from "@repo/query";
import { apiOperation } from "../../../openapi/operation";
import { failureEnvelope, successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const getProcessingRunHandler = new Elysia().get(
	"/processing-runs/:runId",
	async ({ params, request, set }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:read");
		const data = await getProcessingRun({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, params.runId);
		if (!data) set.status = 404;
		return data
			? { success: true as const, data }
			: { success: false as const, error: "NOT_FOUND" as const, message: "Processing run not found" };
	},
	{
		params: t.Object({ runId: t.String({ description: "Processing run identifier.", examples: ["run_1"] }) }),
		response: {
			200: successEnvelope(
				t.Object(
					{},
					{ additionalProperties: true, description: "Processing run detail.", examples: [{ id: "run_1", status: "COMPLETED" }] },
				),
				{ description: "Processing run response.", example: { success: true, data: { id: "run_1", status: "COMPLETED" } } },
			),
			404: failureEnvelope({
				description: "Processing run not found.",
				example: { success: false, error: "NOT_FOUND", message: "Processing run not found" },
			}),
		},
		detail: apiOperation({
			summary: "Get a processing run",
			description: "Returns one workspace-scoped processing run.",
			tags: ["Processing"],
		}),
	},
);
