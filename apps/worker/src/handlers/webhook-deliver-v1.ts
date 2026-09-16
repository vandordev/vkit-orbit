import { enqueueIntent, recordWebhookAttempt } from "@repo/application";
import { webhookDeliverV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createWebhookDeliverHandler = (db: any, deliver: (deliveryId: string) => Promise<number | "network">) =>
	typedHandler(webhookDeliverV1, async (payload) => {
		const delivery = await db.webhookDelivery.findFirst({
			where: { workspaceId: payload.workspaceId, id: payload.deliveryId, status: "PENDING" },
		});
		if (!delivery) return "NO_OP";
		const status = await deliver(payload.deliveryId);
		const outcome =
			status === "network" || status >= 500 || status === 429
				? "RETRYABLE"
				: status >= 200 && status < 300
					? "SUCCESS"
					: status >= 400
						? "TERMINAL"
						: "UNKNOWN";
		const nextRevision = payload.revision + 1;
		if (outcome === "RETRYABLE") {
			await db.$transaction(async (tx: any) => {
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
