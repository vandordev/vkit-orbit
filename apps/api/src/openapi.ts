import { openapi } from "@elysiajs/openapi";

import { getEnv } from "./lib/env";

export const createOpenapiPlugin = () => openapi({
	path: "/docs",
	specPath: "/openapi.json",
	provider: "scalar",
	scalar: { url: "/openapi.json" },
	documentation: {
		openapi: "3.0.3",
		info: { title: "API", version: "1.0.0", description: "Generated from Elysia route schemas." },
		servers: [{ url: getEnv().api.openapi.serverUrl }],
		tags: [
			{ name: "Health", description: "Process liveness and readiness" },
			{ name: "System", description: "Lightweight status probes" },
		],
	},
});
