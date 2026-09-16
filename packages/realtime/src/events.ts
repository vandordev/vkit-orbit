import { z } from "zod";

export const realtimeEventSchema = z.object({
	type: z.literal("document.processing.updated"),
	eventId: z.string().uuid(),
	occurredAt: z.string().datetime(),
	documentId: z.string().min(1),
	runId: z.string().min(1),
	workspaceId: z.string().min(1),
});

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;

export function roomsForEvent(event: RealtimeEvent): string[] {
	return [`document:${event.documentId}`, `run:${event.runId}`, `workspace:${event.workspaceId}`];
}
