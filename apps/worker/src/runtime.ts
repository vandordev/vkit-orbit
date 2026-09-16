import { createWorkerConnection, type QueueName } from "@repo/queue";
import { Worker } from "bullmq";
export function createWorkerRuntime(input: {
	handlers: Record<string, (job: any) => Promise<unknown>>;
	queueName?: QueueName;
	config?: Parameters<typeof createWorkerConnection>[0];
}) {
	const worker = new Worker(
		input.queueName ?? "documents",
		async (job) => {
			const handler = input.handlers[job.name];
			if (!handler) throw new Error(`unknown job: ${job.name}`);
			return handler(job);
		},
		{ connection: createWorkerConnection(input.config) },
	);
	return worker;
}
