import { Elysia, t } from "elysia";
import { cancelProcessingRun } from "@repo/application";
import { apiOperation } from "../../../openapi/operation";
import { successEnvelope } from "../../../schemas/envelope";
import { authenticatedPrincipal, requireApiScope } from "../../../plugins/api-key";

export const cancelProcessingRunHandler = new Elysia().post(
	"/processing-runs/:runId/cancellations",
	async ({ params, request }) => {
		const principal = await authenticatedPrincipal(request);
		requireApiScope(principal, "documents:write");
		return {
			success: true as const,
			data: await cancelProcessingRun({ workspaceId: principal!.workspaceId, principalId: principal!.userId }, params.runId),
		};
	},
	{
		params: t.Object({ runId: t.String({ description: "Processing run identifier.", examples: ["run_1"] }) }),
		response: successEnvelope(
			t.Object(
				{},
				{ additionalProperties: true, description: "Canceled processing run.", examples: [{ id: "run_1", status: "CANCELED" }] },
			),
			{ description: "Cancellation response.", example: { success: true, data: { id: "run_1", status: "CANCELED" } } },
		),
		detail: apiOperation({
			summary: "Cancel processing",
			description: "Cancels an active workspace processing run.",
			tags: ["Processing"],
		}),
	},
);
