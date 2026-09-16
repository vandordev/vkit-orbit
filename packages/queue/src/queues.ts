export const queueNames = {
	documents: "documents",
	webhooks: "webhooks",
	notifications: "notifications",
} as const;
export type QueueName = (typeof queueNames)[keyof typeof queueNames];
