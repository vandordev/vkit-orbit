import { Elysia, t } from "elysia";

import type { ExampleRealtimeNotificationPayload } from "@repo/queue";

export type ExampleEnqueueResult = { job?: { id: number }; id?: number };
export type EnqueueExample = (payload: ExampleRealtimeNotificationPayload) => Promise<ExampleEnqueueResult>;

export function createExampleRoutes(enqueueExample: EnqueueExample) {
	return new Elysia({ prefix: "/api/examples", tags: ["Examples"] }).post(
		"/realtime-notifications",
		async ({ body, set }) => {
			const result = await enqueueExample(body);
			set.status = 202;
			return { success: true as const, data: { jobId: result.job?.id ?? result.id ?? null } };
		},
		{ body: t.Object({ resourceId: t.String({ minLength: 1 }), workspaceId: t.String({ minLength: 1 }) }) },
	);
}
