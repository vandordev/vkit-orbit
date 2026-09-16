import { prisma } from "@repo/database";
import { enqueueIntent } from "../outbox/enqueue-intent";
export async function recoverWebhooks(input: { limit?: number }, db: any = prisma) {
	const due = await db.webhookDelivery.findMany({
		where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
		take: input.limit ?? 100,
	});
	for (const delivery of due)
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
	return due.length;
}
