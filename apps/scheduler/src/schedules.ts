import { exampleRealtimeNotificationJob, type ExampleRealtimeNotificationPayload, type JobContract } from "@repo/queue";

type ScheduleConfig = { ENABLE_EXAMPLE_SCHEDULE: boolean; EXAMPLE_SCHEDULE_INTERVAL_MS: number };
type ScheduleDependencies = { enqueue(contract: JobContract<typeof exampleRealtimeNotificationJob.schema>, payload: ExampleRealtimeNotificationPayload): Promise<unknown> };

const examplePayload = { resourceId: "example-resource", workspaceId: "example-workspace" } satisfies ExampleRealtimeNotificationPayload;

export function registerSchedules(dependencies: ScheduleDependencies, config: ScheduleConfig): () => void {
	if (!config.ENABLE_EXAMPLE_SCHEDULE) return () => {};
	void dependencies.enqueue(exampleRealtimeNotificationJob, examplePayload);
	const timer = setInterval(() => void dependencies.enqueue(exampleRealtimeNotificationJob, examplePayload), config.EXAMPLE_SCHEDULE_INTERVAL_MS);
	return () => clearInterval(timer);
}
