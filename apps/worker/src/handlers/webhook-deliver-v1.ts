import { enqueueIntent, recordWebhookAttempt, classifyWebhookResponse } from "@repo/application";
import { webhookDeliverV1 } from "@repo/queue";
import { typedHandler } from "./types";
import type { DatabaseClient } from "@repo/database";
export const createWebhookDeliverHandler = (db: DatabaseClient, deliver: (deliveryId: string) => Promise<number | "network">) =>
	typedHandler(webhookDeliverV1, async (payload) => {
		const claimed = await db.webhookDelivery.updateMany({
			where: {
				workspaceId: payload.workspaceId,
				id: payload.deliveryId,
				status: "PENDING",
				attempts: payload.revision - 1,
				nextAttemptAt: { lte: new Date() },
			},
			data: { status: "PROCESSING", leaseExpiresAt: new Date(Date.now() + 30_000) },
		});
		if (claimed.count !== 1) return "NO_OP";
		let status: number | "network";
		try {
			status = await deliver(payload.deliveryId);
		} catch {
			status = "network";
		}
		const classified = classifyWebhookResponse(status);
		const outcome = payload.revision >= 8 && classified !== "SUCCESS" ? "TERMINAL" : classified === "UNKNOWN" ? "RETRYABLE" : classified;
		const nextRevision = payload.revision + 1;
		if (outcome === "RETRYABLE") {
			await db.$transaction(async (tx) => {
				await recordWebhookAttempt(
					{
						workspaceId: payload.workspaceId,
						deliveryId: payload.deliveryId,
						outcome,
						nextAttemptAt: new Date(Date.now() + Math.min(60_000, 1_000 * 2 ** (payload.revision - 1))),
					},
					tx,
				);
				await enqueueIntent(
					{
						workspaceId: payload.workspaceId,
						contract: "webhook.deliver.v1",
						businessId: payload.deliveryId,
						revision: nextRevision,
						payload: { ...payload, revision: nextRevision },
						availableAt: new Date(Date.now() + Math.min(60_000, 1_000 * 2 ** (payload.revision - 1))),
					},
					tx,
				);
			});
			return "SUCCESS";
		}
		await recordWebhookAttempt({ workspaceId: payload.workspaceId, deliveryId: payload.deliveryId, outcome }, db);
		return outcome;
	});
