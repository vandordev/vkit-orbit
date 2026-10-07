import { recoverProcessing, recoverWebhooks, cleanupDocuments } from "@repo/application";
import type { DatabaseClient } from "@repo/database";
import { processingRecoveryV1, webhookRecoveryV1, uploadCleanupV1 } from "@repo/queue";
import { typedHandler } from "./types";

export function createMaintenanceHandlers(db: DatabaseClient) {
	return {
		[processingRecoveryV1.name]: typedHandler(processingRecoveryV1, async ({ limit }) => {
			await recoverProcessing({ limit }, db);
			return "SUCCESS";
		}),
		[webhookRecoveryV1.name]: typedHandler(webhookRecoveryV1, async ({ limit }) => {
			await recoverWebhooks({ limit }, db);
			return "SUCCESS";
		}),
		[uploadCleanupV1.name]: typedHandler(uploadCleanupV1, async ({ limit }) => {
			await cleanupDocuments({ limit, before: new Date(Date.now() - 24 * 60 * 60 * 1000) }, db);
			return "SUCCESS";
		}),
	};
}
