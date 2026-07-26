import { expect, test } from "bun:test";
import { Elysia, t } from "elysia";

import { blockedPathsPlugin } from "./blocked-paths";
import { documentationAuthPlugin } from "./documentation-auth";
import { errorEnvelopePlugin } from "./error-envelope";
import { requestContextPlugin } from "./request-context";

test("exports named platform plugins", () => {
	expect(blockedPathsPlugin.config.name).toBe("blocked-paths");
	expect(documentationAuthPlugin.config.name).toBe("documentation-auth");
	expect(errorEnvelopePlugin.config.name).toBe("error-envelope");
	expect(requestContextPlugin.config.name).toBe("request-context");
});

test("uses 422 for schema validation failures", async () => {
	const app = new Elysia().use(errorEnvelopePlugin).get("/probe", () => ({ ok: true }), {
		query: t.Object({ limit: t.Numeric() }),
	});

	const response = await app.handle(new Request("http://localhost/probe?limit=invalid"));

	expect(response.status).toBe(422);
	expect(await response.json()).toMatchObject({ success: false, error: "VALIDATION_ERROR" });
});
