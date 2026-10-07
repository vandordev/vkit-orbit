import { prisma, type DatabaseClient } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
import { prepareDelivery, prepareWebhookEnvelope } from "../webhooks/prepare-delivery";
import { runtimeWebhookSecretCrypto, type WebhookSecretCrypto } from "../webhooks/secret";
export async function completeFinalization(
	input: {
		workspaceId: string;
		runId: string;
		revision: number;
		artifact: { id: string; documentId: string; objectKey: string; contentType: string; byteSize: number; checksum?: string };
	},
	db: DatabaseClient = prisma,
	secretCrypto?: WebhookSecretCrypto,
) {
	return db.$transaction(async (tx) => {
		const run = await tx.processingRun.findFirst({
			where: { workspaceId: input.workspaceId, id: input.runId, stageRevision: input.revision },
		});
		if (!run || run.status !== "FINALIZING") return false;
		const transitioned = await tx.processingRun.updateMany({
			where: { workspaceId: input.workspaceId, id: input.runId, status: "FINALIZING", stageRevision: input.revision },
			data: { status: "COMPLETED", leaseExpiresAt: null },
		});
		if (transitioned.count !== 1) return false;
		await tx.documentArtifact.upsert({
			where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.artifact.id } },
			create: { ...input.artifact, workspaceId: input.workspaceId, processingRunId: input.runId, kind: "RESULT" },
			update: {},
		});
		const eventId = crypto.randomUUID();
		const event = {
			type: "document.processing.updated",
			eventId,
			occurredAt: new Date().toISOString(),
			workspaceId: input.workspaceId,
			documentId: run.documentId,
			runId: run.id,
		};
		await tx.auditLog.create({
			data: {
				id: eventId,
				workspaceId: input.workspaceId,
				principalId: "worker",
				action: "processing.completed",
				resourceType: "processing_run",
				resourceId: run.id,
				metadata: event,
			},
		});
		await enqueueIntent(
			{
				workspaceId: input.workspaceId,
				contract: "notification.publish.v1",
				businessId: eventId,
				revision: 1,
				payload: { workspaceId: input.workspaceId, eventId, revision: 1 },
			},
			tx,
		);
		const endpoints = await tx.webhookEndpoint.findMany({ where: { workspaceId: input.workspaceId, active: true } });
		for (const endpoint of endpoints) {
			if (!Array.isArray(endpoint.events) || !endpoint.events.includes("document.processing.completed.v1")) continue;
			// Hash-only legacy endpoints cannot sign future events; operators must
			// recreate them. Never invent a replacement signing key.
			if (!endpoint.encryptedSecret) continue;
			const secret = (secretCrypto ?? runtimeWebhookSecretCrypto()).decrypt(endpoint.encryptedSecret);
			const envelope = prepareWebhookEnvelope({
				event: "document.processing.completed.v1",
				eventId,
				payload: { workspaceId: input.workspaceId, documentId: run.documentId, runId: run.id, status: "COMPLETED" },
				secret,
			});
			const delivery = await prepareDelivery({ workspaceId: input.workspaceId, endpointId: endpoint.id, eventId, ...envelope }, tx);
			await enqueueIntent(
				{
					workspaceId: input.workspaceId,
					contract: "webhook.deliver.v1",
					businessId: delivery.id,
					revision: 1,
					payload: { workspaceId: input.workspaceId, deliveryId: delivery.id, revision: 1 },
				},
				tx,
			);
		}
		return true;
	});
}
