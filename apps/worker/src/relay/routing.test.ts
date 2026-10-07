import { expect, test } from "bun:test";
import { runOutboxRelay } from "./relay";

test("relay routes webhook and notification contracts to their owned queues", async () => {
	const sent: string[] = [];
	const db = {
		queueOutbox: {
			findMany: async () => [
				{
					id: "one",
					contract: "webhook.deliver.v1",
					businessId: "delivery_one",
					revision: 1,
					payload: { workspaceId: "ws_one", deliveryId: "delivery_one", revision: 1 },
				},
				{
					id: "two",
					contract: "notification.publish.v1",
					businessId: "event_one",
					revision: 1,
					payload: { workspaceId: "ws_one", eventId: "event_one", revision: 1 },
				},
			],
			updateMany: async () => ({ count: 1 }),
			update: async () => ({}),
		},
	};
	const queue = (name: string) => ({
		add: async () => {
			sent.push(name);
		},
	});
	await runOutboxRelay({
		db,
		queue: queue("documents"),
		queues: { documents: queue("documents"), webhooks: queue("webhooks"), notifications: queue("notifications") },
	});
	expect(sent).toEqual(["webhooks", "notifications"]);
});

test("recovered intents remove retained completed jobs before deterministic re-enqueue", async () => {
	const calls: string[] = [];
	const db = {
		queueOutbox: {
			findMany: async () => [
				{
					id: "one",
					contract: "document.validate.v1",
					businessId: "run_one",
					revision: 1,
					payload: { workspaceId: "ws_one", runId: "run_one", revision: 1 },
				},
			],
			updateMany: async () => ({ count: 1 }),
			update: async () => ({}),
		},
	};
	await runOutboxRelay({
		db,
		queue: {
			getJob: async () => ({
				getState: async () => "completed",
				remove: async () => {
					calls.push("remove");
				},
			}),
			add: async () => {
				calls.push("add");
			},
		},
	});
	expect(calls).toEqual(["remove", "add"]);
});
