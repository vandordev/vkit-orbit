import { exampleRealtimeNotificationJob, type ExampleRealtimeNotificationPayload, type JobContract } from "@repo/queue";

type ScheduleDependencies = {
	enqueue(
		contract: JobContract<typeof exampleRealtimeNotificationJob.schema>,
		payload: ExampleRealtimeNotificationPayload,
	): Promise<unknown>;
};
type ScheduleConfig = { intervalMs: number };

const examplePayload = { resourceId: "example-resource", workspaceId: "example-workspace" } satisfies ExampleRealtimeNotificationPayload;

export function registerSchedules(dependencies: ScheduleDependencies, config: ScheduleConfig): () => void {
	void dependencies.enqueue(exampleRealtimeNotificationJob, examplePayload);
	const timer = setInterval(() => void dependencies.enqueue(exampleRealtimeNotificationJob, examplePayload), config.intervalMs);
	return () => clearInterval(timer);
}
