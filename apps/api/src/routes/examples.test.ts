import { describe, expect, test } from "bun:test";

import { createApp } from "../app";

describe("realtime notification example", () => {
	test("enqueues the example job from Elysia", async () => {
		const enqueueExample = async () => ({ job: { id: 42 } });
		const app = createApp({ enqueueExample });
		const response = await app.fetch(new Request("http://localhost:4100/api/examples/realtime-notifications", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ resourceId: "r1", workspaceId: "w1" }),
		}));
		expect(response.status).toBe(202);
		expect(await response.json()).toEqual({ success: true, data: { jobId: 42 } });
	});
});
