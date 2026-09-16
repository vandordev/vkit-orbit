import { cleanupPayload, type JobContract } from "./types";
export const documentCleanupV1: JobContract<typeof cleanupPayload> = {
	name: "document.cleanup.v1",
	queue: "documents",
	schema: cleanupPayload,
};
