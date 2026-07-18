import { createRealtimePublisher as createSocketPublisher } from "@repo/realtime";
import type { RealtimeEvent } from "@repo/realtime";

type Config = { baseUrl: string; apiKey: string; fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };

export function createRealtimePublisher(config: Config): (event: RealtimeEvent) => Promise<void> {
	const publisher = createSocketPublisher(config);
	return (event) => publisher.publish(event);
}
