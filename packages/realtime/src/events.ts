import { z } from "zod";
import { wireDatetimeSchema } from "./wire-datetime";

export const realtimeEventSchema = z.object({
	type: z.literal("document.processing.updated"),
	// Preserve the v1 wire contract: Zod 3 accepted UUID-shaped hexadecimal IDs,
	// without requiring RFC version/variant bits (Zod 4's uuid validator does).
	eventId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
	occurredAt: wireDatetimeSchema,
	documentId: z.string().min(1),
	runId: z.string().min(1),
	workspaceId: z.string().min(1),
});

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export function roomsForEvent(event: RealtimeEvent): string[] {
	return [`document:${event.documentId}`, `run:${event.runId}`, `workspace:${event.workspaceId}`];
}
