import { z } from "zod";

export type JobContract<T extends z.ZodTypeAny = z.ZodTypeAny> = {
	name: string;
	queue: "documents" | "webhooks" | "notifications";
	schema: T;
};

const id = z.string().trim().min(1);
export const stagePayload = z.object({ workspaceId: id, runId: id, revision: z.number().int().positive() }).strict();
export const webhookPayload = z.object({ workspaceId: id, deliveryId: id, revision: z.number().int().positive() }).strict();
export const recoveryPayload = z.object({ workspaceId: id, runId: id, revision: z.number().int().positive() }).strict();
export const cleanupPayload = z.object({ workspaceId: id, documentId: id, revision: z.number().int().positive() }).strict();
export const notificationPayload = z.object({ workspaceId: id, eventId: id, revision: z.number().int().positive() }).strict();
