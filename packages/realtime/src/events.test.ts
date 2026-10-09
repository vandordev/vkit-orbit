import { expect, test } from "bun:test";

import { realtimeEventSchema, roomsForEvent } from "./events";

test("preserves UUID-shaped legacy event IDs and rejects malformed values", () => {
	const event = { type: "document.processing.updated", eventId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", occurredAt: "2026-10-10T00:00:00.000Z", documentId: "d", runId: "r", workspaceId: "w" };
	expect(realtimeEventSchema.parse(event).eventId).toBe(event.eventId);
	expect(realtimeEventSchema.safeParse({ ...event, eventId: "invalid" }).success).toBe(false);
	expect(realtimeEventSchema.safeParse({ ...event, occurredAt: "not-a-date" }).success).toBe(false);
});

test("routes a document event to document, run, and workspace rooms", () => {
	const event = realtimeEventSchema.parse({
		type: "document.processing.updated",
		eventId: crypto.randomUUID(),
		occurredAt: new Date().toISOString(),
		documentId: "d1",
		runId: "r1",
		workspaceId: "w1",
	});

	expect(roomsForEvent(event)).toEqual(["document:d1", "run:r1", "workspace:w1"]);
});
