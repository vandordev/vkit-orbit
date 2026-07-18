import { expect, test } from "bun:test";

import { exampleRealtimeNotificationJob } from "./example-realtime-notification";

test("defines the versioned realtime notification contract", () => {
	expect(exampleRealtimeNotificationJob.kind).toBe("example.realtime-notification.v1");
	expect(exampleRealtimeNotificationJob.schema.parse({ resourceId: "r1", workspaceId: "w1" })).toEqual({ resourceId: "r1", workspaceId: "w1" });
});
