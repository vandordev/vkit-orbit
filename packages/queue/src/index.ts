export { queueNames } from "./queues";
export type { QueueName } from "./queues";
export { queueDefaults, retryDelay } from "./defaults";
export { createJobId } from "./job-id";
export { createQueue, createWorkerConnection } from "./redis";
export type { JobContract } from "./contracts/types";
export { documentValidateV1 } from "./contracts/document-validate-v1";
export { documentAnalyzeV1 } from "./contracts/document-analyze-v1";
export { documentFinalizeV1 } from "./contracts/document-finalize-v1";
export { webhookDeliverV1 } from "./contracts/webhook-deliver-v1";
export { documentRecoverV1 } from "./contracts/document-recover-v1";
export { documentCleanupV1 } from "./contracts/document-cleanup-v1";
export { notificationPublishV1 } from "./contracts/notification-publish-v1";
import type { JobContract } from "./contracts/types";
import { documentValidateV1 } from "./contracts/document-validate-v1";
import { documentAnalyzeV1 } from "./contracts/document-analyze-v1";
import { documentFinalizeV1 } from "./contracts/document-finalize-v1";
import { webhookDeliverV1 } from "./contracts/webhook-deliver-v1";
import { documentRecoverV1 } from "./contracts/document-recover-v1";
import { documentCleanupV1 } from "./contracts/document-cleanup-v1";
import { notificationPublishV1 } from "./contracts/notification-publish-v1";
import { processingRecoveryV1, webhookRecoveryV1, uploadCleanupV1 } from "./contracts/maintenance-v1";
export { processingRecoveryV1, webhookRecoveryV1, uploadCleanupV1 } from "./contracts/maintenance-v1";
export const jobContracts = {
	"document.validate.v1": documentValidateV1,
	"document.analyze.v1": documentAnalyzeV1,
	"document.finalize.v1": documentFinalizeV1,
	"webhook.deliver.v1": webhookDeliverV1,
	"document.recover.v1": documentRecoverV1,
	"document.cleanup.v1": documentCleanupV1,
	"notification.publish.v1": notificationPublishV1,
	"maintenance.processing.v1": processingRecoveryV1,
	"maintenance.webhooks.v1": webhookRecoveryV1,
	"maintenance.uploads.v1": uploadCleanupV1,
} as const satisfies Record<string, JobContract>;
export function parseJobPayload<K extends keyof typeof jobContracts>(
	name: K,
	payload: unknown,
): ReturnType<(typeof jobContracts)[K]["schema"]["parse"]> {
	return jobContracts[name].schema.parse(payload) as never;
}
