import { expect, test } from "bun:test";

import { t } from "elysia";

import { failureEnvelope, successEnvelope } from "./envelope";

test("defines reusable success and failure envelopes", () => {
	const success = successEnvelope(t.Object({ ok: t.Boolean() }), {
		description: "Successful response.",
		example: { success: true, data: { ok: true } },
	});
	const failure = failureEnvelope({
		description: "Failure response.",
		example: { success: false, error: "ERROR", message: "Request failed" },
	});

	expect(success.properties.success.const).toBe(true);
	expect(success.properties.data.properties.ok.type).toBe("boolean");
	expect(failure.properties.success.const).toBe(false);
	expect(failure.properties.error.type).toBe("string");
});

test("documents success and failure envelope schemas", () => {
	const success = successEnvelope(
		t.Object({
			status: t.Literal("ok", {
				description: "Current service status.",
				examples: ["ok"],
			}),
		}),
		{
			description: "API status response.",
			example: { success: true, data: { status: "ok" } },
		},
	);
	const failure = failureEnvelope({
		description: "Validation failure response.",
		example: { success: false, error: "VALIDATION_ERROR", message: "Validation failed" },
	});

	expect(success.description).toBe("API status response.");
	expect(success.examples).toEqual([{ success: true, data: { status: "ok" } }]);
	expect(success.properties.success.description).toBe("Whether the request completed successfully.");
	expect(failure.description).toBe("Validation failure response.");
	expect(failure.examples).toEqual([{ success: false, error: "VALIDATION_ERROR", message: "Validation failed" }]);
	expect(failure.properties.error.description).toBe("Machine-readable error code.");
	expect(failure.properties.message.description).toBe("Human-readable explanation of the error.");
});
