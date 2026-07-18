import { expect, test } from "bun:test";

import { createRealtimePublisher } from "./realtime-publisher";

test("publishes a validated event to the private realtime runtime", async () => {
	let request: Request | undefined;
	const publisher = createRealtimePublisher({ baseUrl: "http://realtime:4102", apiKey: "realtime-key", fetch: async (input, init) => { request = new Request(input, init); return new Response(null, { status: 202 }); } });
	await publisher({ type: "resource.updated", eventId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12", occurredAt: "2026-07-19T00:00:00.000Z", resourceId: "r1", workspaceId: "w1" });
	expect(request?.url).toBe("http://realtime:4102/internal/events");
	expect(request?.headers.get("x-realtime-api-key")).toBe("realtime-key");
});
