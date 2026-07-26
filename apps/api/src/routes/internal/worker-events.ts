import { timingSafeEqual } from "node:crypto";

import { Elysia, t } from "elysia";
import { realtimeEventSchema, type RealtimeEvent } from "@repo/realtime";

import { publishRealtimeEvent, workerNotificationApiKey } from "../../runtime";
import { failureEnvelope, successEnvelope } from "../../schemas/envelope";

function matchesSecret(expected: string, actual: string | null) {
	if (!actual) return false;
	const left = Buffer.from(expected);
	const right = Buffer.from(actual);
	return left.length === right.length && timingSafeEqual(left, right);
}

export const workerEventRoutes = new Elysia({ prefix: "/api/internal", tags: ["Internal"] }).post(
	"/worker-events",
	async ({ request, body, set }) => {
		if (!matchesSecret(workerNotificationApiKey, request.headers.get("x-worker-notification-key"))) {
			set.status = 401;
			return { success: false as const, error: "UNAUTHORIZED" as const, message: "Worker notification authentication required" };
		}
		const parsed = realtimeEventSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { success: false as const, error: "VALIDATION_ERROR" as const, message: "Validation failed" };
		}
		try {
			await publishRealtimeEvent(parsed.data as RealtimeEvent);
		} catch {
			set.status = 503;
			return { success: false as const, error: "REALTIME_UNAVAILABLE" as const, message: "Realtime publisher unavailable" };
		}
		set.status = 202;
		return { success: true as const, data: { accepted: true as const } };
	},
	{
		// Authentication must run before body validation so malformed unauthenticated requests remain 401.
		body: t.Any(),
		response: {
			202: successEnvelope(t.Object({ accepted: t.Literal(true) })),
			400: failureEnvelope(),
			401: failureEnvelope(),
			503: failureEnvelope(),
		},
		detail: { hide: true },
	},
);
