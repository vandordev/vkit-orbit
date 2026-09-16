import { webhookPayload, type JobContract } from "./types";
export const webhookDeliverV1: JobContract<typeof webhookPayload> = {
	name: "webhook.deliver.v1",
	queue: "webhooks",
	schema: webhookPayload,
};
