import { Elysia } from "elysia";

import { logContext, getLogger } from "../lib/logger";

export const requestContextPlugin = new Elysia({ name: "request-context" })
	.derive(({ request, headers }) => {
		const requestId = headers["x-request-id"] || crypto.randomUUID();
		const startedAt = Date.now();
		getLogger().info(
			logContext({ requestId, correlationId: requestId, service: "api", method: request.method, path: new URL(request.url).pathname }),
			`[REQUEST] ${request.method} ${new URL(request.url).pathname}`,
		);
		return { requestId, startedAt };
	})
	.onAfterHandle(({ request, set, requestId, startedAt }) => {
		set.headers["x-request-id"] = requestId;
		getLogger().info(
			logContext({ requestId, correlationId: requestId, service: "api", durationMs: Date.now() - startedAt, outcome: String(set.status) }),
			`[RESPONSE] ${request.method} ${new URL(request.url).pathname} ${set.status}`,
		);
	})
	.as("global");
