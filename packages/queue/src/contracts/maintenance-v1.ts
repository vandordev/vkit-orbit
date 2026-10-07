import { z } from "zod";
import type { JobContract } from "./types";

const maintenancePayload = z.object({ limit: z.number().int().min(1).max(1000).default(100) }).strict();
export const processingRecoveryV1 = {
	name: "maintenance.processing.v1",
	queue: "documents",
	schema: maintenancePayload,
} as const satisfies JobContract;
export const webhookRecoveryV1 = {
	name: "maintenance.webhooks.v1",
	queue: "webhooks",
	schema: maintenancePayload,
} as const satisfies JobContract;
export const uploadCleanupV1 = {
	name: "maintenance.uploads.v1",
	queue: "documents",
	schema: maintenancePayload,
} as const satisfies JobContract;
