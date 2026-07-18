import { timingSafeEqual } from "node:crypto";

import { Elysia, t } from "elysia";
import { realtimeEventSchema, type RealtimeEvent } from "@repo/realtime";

type Dependencies = { workerNotificationApiKey: string; publish(event: RealtimeEvent): Promise<void> };

function matchesSecret(expected: string, actual: string | null) {
	if (!actual) return false;
	const left = Buffer.from(expected);
	const right = Buffer.from(actual);
	return left.length === right.length && timingSafeEqual(left, right);
}

export function createInternalNotificationRoutes(dependencies: Dependencies) {
	return new Elysia({ prefix: "/api/internal", tags: ["Internal"] }).post(
		"/worker-events",
		async ({ request, body, set }) => {
			if (!matchesSecret(dependencies.workerNotificationApiKey, request.headers.get("x-worker-notification-key"))) {
				set.status = 401;
				return { success: false as const, error: "UNAUTHORIZED" as const, message: "Worker notification authentication required" };
			}
			const parsed = realtimeEventSchema.safeParse(body);
			if (!parsed.success) {
				set.status = 400;
				return { success: false as const, error: "VALIDATION_ERROR" as const, message: "Validation failed" };
			}
			try {
				await dependencies.publish(parsed.data);
			} catch {
				set.status = 503;
				return { success: false as const, error: "REALTIME_UNAVAILABLE" as const, message: "Realtime publisher unavailable" };
			}
			set.status = 202;
			return { success: true as const, data: { accepted: true as const } };
		},
		{ body: t.Any() },
	);
}
