import { queueDefaults } from "@repo/queue";
export const schedulerIds = {
	processingRecovery: "dph.processing-recovery.v1",
	webhookRecovery: "dph.webhook-recovery.v1",
	documentCleanup: "dph.document-cleanup.v1",
} as const;
export async function installSchedulers(queue: {
	upsertJobScheduler: (
		id: string,
		opts: { every: number },
		template: { name: string; data: unknown; opts: typeof queueDefaults },
	) => Promise<unknown>;
}) {
	await queue.upsertJobScheduler(
		schedulerIds.processingRecovery,
		{ every: 60_000 },
		{ name: "document.recover.v1", data: { workspaceId: "system", runId: "recovery", revision: 1 }, opts: queueDefaults },
	);
	await queue.upsertJobScheduler(
		schedulerIds.webhookRecovery,
		{ every: 30_000 },
		{ name: "webhook.deliver.v1", data: { workspaceId: "system", deliveryId: "recovery", revision: 1 }, opts: queueDefaults },
	);
	await queue.upsertJobScheduler(
		schedulerIds.documentCleanup,
		{ every: 3_600_000 },
		{ name: "document.cleanup.v1", data: { workspaceId: "system", documentId: "cleanup", revision: 1 }, opts: queueDefaults },
	);
}
