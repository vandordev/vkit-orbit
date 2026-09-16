import { expect, test } from "bun:test";
import { classifyWebhookResponse } from "./record-attempt";
test("classifies webhook ownership without delegating business retry to BullMQ", () => {
	expect(classifyWebhookResponse(204)).toBe("SUCCESS");
	expect(classifyWebhookResponse(503)).toBe("RETRYABLE");
	expect(classifyWebhookResponse(400)).toBe("TERMINAL");
	expect(classifyWebhookResponse("network")).toBe("RETRYABLE");
});
