import { notificationPayload, type JobContract } from "./types";
export const notificationPublishV1: JobContract<typeof notificationPayload> = {
	name: "notification.publish.v1",
	queue: "notifications",
	schema: notificationPayload,
};
