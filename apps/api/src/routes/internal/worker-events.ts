import { timingSafeEqual } from "node:crypto";

import { Elysia, t } from "elysia";
import { realtimeEventSchema, type RealtimeEvent } from "@repo/realtime";

import { publishRealtimeEvent, workerNotificationApiKey } from "../../runtime";
import { apiOperation } from "../../openapi/operation";
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
			202: successEnvelope(
				t.Object({
					accepted: t.Literal(true, {
						description: "Whether the worker-event notification was accepted for publishing.",
						examples: [true],
					}),
				}),
				{
					description: "Accepted worker-event notification response.",
					example: { success: true, data: { accepted: true } },
				},
			),
			400: failureEnvelope({
				description: "Malformed worker-event notification response.",
				example: { success: false, error: "VALIDATION_ERROR", message: "Validation failed" },
			}),
			401: failureEnvelope({
				description: "Unauthenticated worker-event notification response.",
				example: {
					success: false,
					error: "UNAUTHORIZED",
					message: "Worker notification authentication required",
				},
			}),
			503: failureEnvelope({
				description: "Unavailable realtime publisher response.",
				example: {
					success: false,
					error: "REALTIME_UNAVAILABLE",
					message: "Realtime publisher unavailable",
				},
			}),
		},
		detail: apiOperation({
			summary: "Publish a worker event",
			description:
				"Accepts an authenticated worker event for private realtime publication. The raw API-key header and body remain unvalidated until authentication completes so unauthenticated malformed requests consistently receive 401; this operation is hidden from public OpenAPI.",
			tags: ["Internal"],
			hide: true,
		}),
	},
);
