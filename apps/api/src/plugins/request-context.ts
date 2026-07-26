import { Elysia } from "elysia";

import { logger } from "../lib/logger";

export const requestContextPlugin = new Elysia({ name: "request-context" })
	.derive(({ request, headers }) => {
		const requestId = headers["x-request-id"] || crypto.randomUUID();
		const startedAt = Date.now();
		logger.info(
			{ requestId, method: request.method, path: new URL(request.url).pathname },
			`[REQUEST] ${request.method} ${new URL(request.url).pathname}`,
		);
		return { requestId, startedAt };
	})
	.onAfterHandle(({ request, set, requestId, startedAt }) => {
		set.headers["x-request-id"] = requestId;
		logger.info(
			{ requestId, method: request.method, path: new URL(request.url).pathname, status: set.status, duration: Date.now() - startedAt },
			`[RESPONSE] ${request.method} ${new URL(request.url).pathname} ${set.status}`,
		);
	})
	.as("global");
