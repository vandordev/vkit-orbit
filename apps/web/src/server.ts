import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { redact, safeLogContext } from "@repo/application";

export default createServerEntry({
	fetch: async (request) => {
		const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
		const startedAt = Date.now();
		const response = await handler.fetch(request);
		console.info(
			JSON.stringify(
				redact(
					safeLogContext({
						service: "web",
						requestId,
						correlationId: requestId,
						durationMs: Date.now() - startedAt,
						outcome: String(response.status),
					}),
				),
			),
		);
		response.headers.set("x-request-id", requestId);
		return response;
	},
});
