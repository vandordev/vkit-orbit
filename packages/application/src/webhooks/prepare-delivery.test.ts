import { expect, test } from "bun:test";
import { prepareWebhookEnvelope, signWebhook } from "./prepare-delivery";
test("signs exactly the stored envelope bytes", () => {
	const envelope = prepareWebhookEnvelope({ event: "run.completed", eventId: "evt_1", payload: { ok: true }, secret: "secret" });
	expect(signWebhook("secret", envelope.requestBody)).toBe(envelope.signatureInput);
	expect(envelope.requestBody).toEqual(
		prepareWebhookEnvelope({ event: "run.completed", eventId: "evt_1", payload: { ok: true }, secret: "different" }).requestBody,
	);
});
