import { prisma } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function recoverWebhooks(input: { limit?: number }, db: any = prisma) {
	await db.webhookDelivery.updateMany({
		where: { status: "PROCESSING", leaseExpiresAt: { lt: new Date() } },
		data: { status: "PENDING", leaseExpiresAt: null },
	});
	const due = await db.webhookDelivery.findMany({
		where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
		take: input.limit ?? 100,
	});
	for (const delivery of due) {
		const revision = Math.max(1, delivery.attempts + 1);
		await db.queueOutbox.updateMany({
			where: { workspaceId: delivery.workspaceId, businessId: delivery.id, contract: "webhook.deliver.v1", revision, status: "PUBLISHED" },
			data: { status: "PENDING", availableAt: new Date(), publishedAt: null, claimedAt: null },
		});
		await enqueueIntent(
			{
				workspaceId: delivery.workspaceId,
				contract: "webhook.deliver.v1",
				businessId: delivery.id,
				revision: Math.max(1, delivery.attempts + 1),
				payload: { workspaceId: delivery.workspaceId, deliveryId: delivery.id, revision: Math.max(1, delivery.attempts + 1) },
			},
			db,
		);
	}
	return due.length;
}
