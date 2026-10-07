import { queueDefaults, processingRecoveryV1, webhookRecoveryV1, uploadCleanupV1 } from "@repo/queue";
export const schedulerIds = {
	processingRecovery: "dph.processing-recovery.v1",
	webhookRecovery: "dph.webhook-recovery.v1",
	documentCleanup: "dph.document-cleanup.v1",
} as const;
export async function installSchedulers(
	queue: {
		upsertJobScheduler: (
			id: string,
			opts: { every: number },
			template: { name: string; data: unknown; opts: typeof queueDefaults },
		) => Promise<unknown>;
	},
	webhookQueue = queue,
) {
	await queue.upsertJobScheduler(
		schedulerIds.processingRecovery,
		{ every: 60_000 },
		{ name: processingRecoveryV1.name, data: { limit: 100 }, opts: queueDefaults },
	);
	await webhookQueue.upsertJobScheduler(
		schedulerIds.webhookRecovery,
		{ every: 30_000 },
		{ name: webhookRecoveryV1.name, data: { limit: 100 }, opts: queueDefaults },
	);
	await queue.upsertJobScheduler(
		schedulerIds.documentCleanup,
		{ every: 3_600_000 },
		{ name: uploadCleanupV1.name, data: { limit: 100 }, opts: queueDefaults },
	);
}
