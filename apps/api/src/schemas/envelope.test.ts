import { expect, test } from "bun:test";

import { t } from "elysia";

import { failureEnvelope, successEnvelope } from "./envelope";

test("defines reusable success and failure envelopes", () => {
	const success = successEnvelope(t.Object({ ok: t.Boolean() }));
	const failure = failureEnvelope();

	expect(success.properties.success.const).toBe(true);
	expect(success.properties.data.properties.ok.type).toBe("boolean");
	expect(failure.properties.success.const).toBe(false);
	expect(failure.properties.error.type).toBe("string");
});
