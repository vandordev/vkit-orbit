import type { Job } from "bullmq";
import { parseJobPayload, type JobContract } from "@repo/queue";
export type HandlerResult = "SUCCESS" | "NO_OP" | "RETRYABLE" | "TERMINAL" | "UNKNOWN";
export type JobHandler<T extends JobContract> = (job: Job<unknown>) => Promise<HandlerResult>;
export function typedHandler<T extends JobContract>(
	contract: T,
	run: (payload: ReturnType<T["schema"]["parse"]>, job: Job<unknown>) => Promise<HandlerResult>,
): JobHandler<T> {
	return async (job) => run(parseJobPayload(contract.name as never, job.data), job);
}
