import { Elysia } from "elysia";

import { blockedPathsPlugin } from "./plugins/blocked-paths";
import { documentationAuthPlugin } from "./plugins/documentation-auth";
import { errorEnvelopePlugin } from "./plugins/error-envelope";
import { requestContextPlugin } from "./plugins/request-context";
import { createOpenapiPlugin } from "./openapi";
import { createV1Routes, healthRoutes, workerEventRoutes } from "./routes";

export function createApp() {
	return new Elysia({ name: "api" })
		.use(blockedPathsPlugin)
		.use(documentationAuthPlugin)
		.use(requestContextPlugin)
		.use(createOpenapiPlugin())
		.use(errorEnvelopePlugin)
		.use(healthRoutes)
		.use(createV1Routes())
		.use(workerEventRoutes);
}
