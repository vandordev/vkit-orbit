import { describe, expect, mock, test } from "bun:test";

const validEvent = {
	type: "resource.updated",
	eventId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12",
	occurredAt: "2026-07-19T00:00:00.000Z",
	resourceId: "r1",
	workspaceId: "w1",
};

function authenticatedRequest(body: unknown = validEvent) {
	return new Request("http://localhost:4100/api/internal/worker-events", {
		method: "POST",
		headers: { "content-type": "application/json", "x-worker-notification-key": "worker-key" },
		body: JSON.stringify(body),
	});
}

describe("worker notification gateway", () => {
	test("hides its documented operation from public OpenAPI", async () => {
		const source = await Bun.file(new URL("./worker-events.ts", import.meta.url)).text();

		expect(source).toContain("apiOperation(");
		expect(source).toContain("hide: true");
	});

	test("accepts an authenticated worker event and forwards it once", async () => {
		const publishRealtimeEvent = mock(async () => undefined);
		mock.module("../../runtime", () => ({ workerNotificationApiKey: "worker-key", publishRealtimeEvent }));
		const { app } = await import("../../app");

		const response = await app.fetch(authenticatedRequest());
		expect(response.status).toBe(202);
		expect(publishRealtimeEvent).toHaveBeenCalledWith(validEvent);
	});

	test("rejects an invalid or unauthenticated worker event", async () => {
		const { app } = await import("../../app");

		expect((await app.fetch(new Request("http://localhost:4100/api/internal/worker-events", { method: "POST" }))).status).toBe(401);
		expect((await app.fetch(authenticatedRequest({ type: "bad" }))).status).toBe(400);
	});

	test("returns retryable failure when the realtime publisher is unavailable", async () => {
		mock.module("../../runtime", () => ({
			workerNotificationApiKey: "worker-key",
			publishRealtimeEvent: async () => {
				throw new Error("unavailable");
			},
		}));
		const { app } = await import("../../app");

		const response = await app.fetch(authenticatedRequest());
		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({ success: false, error: "REALTIME_UNAVAILABLE" });
	});
});
