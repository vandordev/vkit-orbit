import { Elysia, t } from "elysia";

import { apiOperation } from "../../openapi/operation";
import { successEnvelope } from "../../schemas/envelope";

export const systemRoutes = new Elysia({ name: "api-v1-system", tags: ["System"] }).get(
	"/status",
	() => ({ success: true as const, data: { status: "ok" as const } }),
	{
		response: successEnvelope(
			t.Object({
				status: t.Literal("ok", {
					description: "Current availability status of the versioned public API.",
					examples: ["ok"],
				}),
			}),
			{
				description: "Successful API status response.",
				example: { success: true, data: { status: "ok" } },
			},
		),
		detail: apiOperation({
			summary: "Get API status",
			description: "Returns the current availability status of the versioned public API.",
			tags: ["System"],
		}),
	},
);
