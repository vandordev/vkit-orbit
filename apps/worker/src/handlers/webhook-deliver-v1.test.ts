import { expect, test } from "bun:test";
import { createWebhookDeliverHandler } from "./webhook-deliver-v1";
import type { Job } from "bullmq";
import type { DatabaseClient } from "@repo/database";

test("webhook handler treats HTTP 408 as retryable and persists another durable attempt", async () => {
	let status = "PENDING";
	const intents: unknown[] = [];
	const db = {
		webhookDelivery: {
			findFirst: async () => ({ status, attempts: 0, signatureInput: "synthetic" }),
			updateMany: async () => ({ count: 1 }),
			update: async ({ data }: { data: { status: string } }) => {
				status = data.status;
			},
		},
		queueOutbox: {
			findUnique: async () => null,
			create: async (value: unknown) => {
				intents.push(value);
			},
		},
		$transaction: async (work: (tx: unknown) => Promise<unknown>) => work(db),
	};
	await createWebhookDeliverHandler(
		db as unknown as DatabaseClient,
		async () => 408,
	)({ data: { workspaceId: "ws_one", deliveryId: "delivery_one", revision: 1 } } as Job);
	expect(status).toBe("PENDING");
	expect(intents).toHaveLength(1);
});
