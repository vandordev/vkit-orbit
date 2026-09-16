import { expect, test } from "bun:test";
import { runOutboxRelay } from "./relay";

test("relay publishes deterministic jobs and tolerates the crash-after-add window", async () => {
	const rows = [
		{
			id: "outbox_1",
			contract: "document.validate.v1",
			businessId: "run_1",
			revision: 1,
			payload: { workspaceId: "ws", runId: "run_1", revision: 1 },
		},
	];
	const calls: unknown[] = [];
	const db = {
		queueOutbox: {
			findMany: async () => rows,
			updateMany: async () => ({ count: 1 }),
			update: async (_input: unknown) => _input,
		},
	};
	await runOutboxRelay({
		db,
		queue: {
			add: async (...args) => {
				calls.push(args);
			},
		},
	});
	expect(calls).toHaveLength(1);
	expect((calls[0] as unknown[])[2]).toEqual({ jobId: "document.validate.v1__run_1__1" });
});
