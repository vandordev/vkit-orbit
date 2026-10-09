import { getPrisma, type DatabaseConnection } from "@repo/db";
export function classifyWebhookResponse(status: number | "network"): "SUCCESS" | "RETRYABLE" | "TERMINAL" | "UNKNOWN" {
	if (status === "network" || (typeof status === "number" && (status === 408 || status === 429 || status >= 500))) return "RETRYABLE";
	if (typeof status === "number" && status >= 200 && status < 300) return "SUCCESS";
	if (typeof status === "number" && status >= 400 && status < 500) return "TERMINAL";
	return "UNKNOWN";
}
export async function recordWebhookAttempt(
	input: { workspaceId: string; deliveryId: string; outcome: ReturnType<typeof classifyWebhookResponse>; nextAttemptAt?: Date },
	db: DatabaseConnection = getPrisma(),
) {
	return db.webhookDelivery.update({
		where: { workspaceId_id: { workspaceId: input.workspaceId, id: input.deliveryId } },
		data: {
			attempts: { increment: 1 },
			leaseExpiresAt: null,
			status: input.outcome === "SUCCESS" ? "SUCCEEDED" : input.outcome === "TERMINAL" ? "FAILED" : "PENDING",
			...(input.nextAttemptAt ? { nextAttemptAt: input.nextAttemptAt } : {}),
		},
	});
}
