import { Elysia, t } from "elysia";

import { successEnvelope } from "../../schemas/envelope";

export const systemRoutes = new Elysia({ name: "api-v1-system", tags: ["System"] }).get(
	"/status",
	() => ({ success: true as const, data: { status: "ok" as const } }),
	{
		response: successEnvelope(t.Object({ status: t.Literal("ok") })),
	},
);
