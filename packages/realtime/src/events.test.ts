import { expect, test } from "bun:test";

import { realtimeEventSchema, roomsForEvent } from "./events";

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
