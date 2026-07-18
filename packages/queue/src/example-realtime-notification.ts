import { z } from "zod";

import { defineJob } from "./river";

export const exampleRealtimeNotificationJob = defineJob(
	"example.realtime-notification.v1",
	z.object({ resourceId: z.string().min(1), workspaceId: z.string().min(1) }),
);

export type ExampleRealtimeNotificationPayload = z.infer<typeof exampleRealtimeNotificationJob.schema>;
