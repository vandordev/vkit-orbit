import { expect, test } from "bun:test";
import { withPostgres } from "./harness";
import { createWebhookEndpoint, createWebhookSecretCrypto, completeFinalization } from "@repo/application";
import { createWebhookDeliverHandler } from "../../../../apps/worker/src/handlers/webhook-deliver-v1";
import type { Job } from "bullmq";

test("completion fans out signed deliveries and concurrent consumers claim once", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		await db.document.create({
			data: { id: "doc_one", workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1, status: "READY" },
		});
		await db.processingRun.create({
			data: { id: "run_one", workspaceId: "ws_one", documentId: "doc_one", revision: 1, status: "FINALIZING" },
		});
		const crypto = createWebhookSecretCrypto("a".repeat(64));
		const endpoint = await createWebhookEndpoint(
			{ workspaceId: "ws_one", url: "https://merchant.test/hook", events: ["document.processing.completed.v1"] },
			db,
			{ crypto, urlPolicy: { resolve: async () => ["8.8.8.8"] } },
		);
		expect(endpoint.endpoint.encryptedSecret).not.toContain(endpoint.secret);
		await completeFinalization(
			{
				workspaceId: "ws_one",
				runId: "run_one",
				revision: 1,
				artifact: { id: "art_one", documentId: "doc_one", objectKey: "result-one", contentType: "application/json", byteSize: 2 },
			},
			db,
			crypto,
		);
		const delivery = await db.webhookDelivery.findFirstOrThrow();
		expect(await db.queueOutbox.count({ where: { contract: "webhook.deliver.v1" } })).toBe(1);
		let delivered = 0;
		const handler = createWebhookDeliverHandler(db, async () => {
			delivered++;
			await Bun.sleep(40);
			return 204;
		});
		const job = { data: { workspaceId: "ws_one", deliveryId: delivery.id, revision: 1 } } as Job;
		await Promise.all([handler(job), handler(job)]);
		expect(delivered).toBe(1);
		expect((await db.webhookDelivery.findUniqueOrThrow({ where: { id: delivery.id } })).status).toBe("SUCCEEDED");
	});
}, 60_000);
