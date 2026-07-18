import { expect, test } from "bun:test";

import { exampleRealtimeNotificationJob } from "@repo/queue";

import { registerSchedules } from "./schedules";

test("does not register the example schedule unless enabled", async () => {
	const enqueue = async () => undefined;
	const stop = registerSchedules({ enqueue }, { ENABLE_EXAMPLE_SCHEDULE: false, EXAMPLE_SCHEDULE_INTERVAL_MS: 1 });
	await Bun.sleep(0);
	stop();
	expect(exampleRealtimeNotificationJob.kind).toBe("example.realtime-notification.v1");
});

test("enqueues the example once at startup when enabled", async () => {
	const calls: unknown[] = [];
	const enqueue = async (...args: unknown[]) => { calls.push(args); };
	const stop = registerSchedules({ enqueue }, { ENABLE_EXAMPLE_SCHEDULE: true, EXAMPLE_SCHEDULE_INTERVAL_MS: 60_000 });
	await Bun.sleep(0);
	stop();
	expect(calls).toEqual([[exampleRealtimeNotificationJob, { resourceId: "example-resource", workspaceId: "example-workspace" }]]);
});
