import type { RealtimeEvent } from "@repo/realtime";

import { env } from "./lib/env";
import { createRealtimePublisher } from "./lib/realtime-publisher";

const publisher =
	env.REALTIME_INTERNAL_URL && env.REALTIME_PUBLISH_API_KEY
		? createRealtimePublisher({ baseUrl: env.REALTIME_INTERNAL_URL, apiKey: env.REALTIME_PUBLISH_API_KEY })
		: undefined;

export const workerNotificationApiKey = env.WORKER_NOTIFICATION_API_KEY ?? "";

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
	if (publisher) await publisher(event);
}
