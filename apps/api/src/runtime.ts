import type { RealtimeEvent } from "@repo/realtime";

import { getEnv } from "./lib/env";
import { createRealtimePublisher } from "./lib/realtime-publisher";

let publisher: ReturnType<typeof createRealtimePublisher> | undefined;
export const getWorkerNotificationApiKey = () => getEnv().worker.notificationApiKey ?? "";

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
	const { internalUrl, publishApiKey } = getEnv().realtime;
	if (!publisher && internalUrl && publishApiKey) publisher = createRealtimePublisher({ baseUrl: internalUrl, apiKey: publishApiKey });
	if (publisher) await publisher(event);
}
