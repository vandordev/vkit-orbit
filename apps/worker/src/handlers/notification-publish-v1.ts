import { notificationPublishV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createNotificationPublishHandler = (publish: (payload: unknown) => Promise<void>) =>
	typedHandler(notificationPublishV1, async (payload) => {
		await publish(payload);
		return "SUCCESS";
	});
