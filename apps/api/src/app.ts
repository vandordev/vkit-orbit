import { Elysia } from "elysia";

import { createRiverClient, enqueue, exampleRealtimeNotificationJob, type ExampleRealtimeNotificationPayload } from "@repo/queue";
import { prisma } from "@repo/database";
import type { RealtimeEvent } from "@repo/realtime";

import { env } from "./lib/env";
import { isDocumentationAuthorized } from "./lib/docs-auth";
import { AppError } from "./lib/errors";
import { logger } from "./lib/logger";
import { openapiPlugin } from "./openapi";
import { createRealtimePublisher } from "./lib/realtime-publisher";
import { createExampleRoutes, createInternalNotificationRoutes, healthRoutes, statusRoutes, type EnqueueExample } from "./routes";

const blockedPathPatterns: readonly RegExp[] = [
	/^\/\.env/,
	/^\/\.git/,
	/^\/\.vscode/,
	/^\/node_modules/,
	/^\/package\.json/,
	/^\/bun\.lockb$/,
	/^\/bun\.lock$/,
	/^\/pnpm-lock\.yaml$/,
	/^\/yarn\.lock$/,
	/\/\.env$/,
	/\/\.git\//,
];
const river = createRiverClient(prisma);
const defaultEnqueueExample: EnqueueExample = (payload: ExampleRealtimeNotificationPayload) => enqueue(river, exampleRealtimeNotificationJob, payload) as Promise<{ job?: { id: number }; id?: number }>;

export type AppDependencies = { enqueueExample?: EnqueueExample; workerNotificationApiKey?: string; publish?: (event: RealtimeEvent) => Promise<void> };

export function createApp(dependencies: AppDependencies = {}) {
	const enqueueExample = dependencies.enqueueExample ?? defaultEnqueueExample;
	const publish = dependencies.publish ?? (env.REALTIME_INTERNAL_URL && env.REALTIME_PUBLISH_API_KEY ? createRealtimePublisher({ baseUrl: env.REALTIME_INTERNAL_URL, apiKey: env.REALTIME_PUBLISH_API_KEY }) : async () => {});
	return new Elysia()
		.onRequest(({ request, set }) => {
			const pathname = new URL(request.url).pathname.toLowerCase();
			if (blockedPathPatterns.some((pattern) => pattern.test(pathname))) {
				set.status = 404;
				return { success: false, error: "NOT_FOUND", message: "Resource not found" };
			}
			if (pathname === "/api/docs" || pathname === "/api/openapi.json") {
				if (!isDocumentationAuthorized(request.headers.get("authorization") ?? undefined, env.OPENAPI_BASIC_AUTH_USERNAME, env.OPENAPI_BASIC_AUTH_PASSWORD)) {
					set.status = 401;
					set.headers["www-authenticate"] = 'Basic realm="API documentation"';
					return { success: false, error: "UNAUTHORIZED", message: "Documentation authentication required" };
				}
			}
		})
		.derive(({ request, headers }) => {
			const requestId = headers["x-request-id"] || crypto.randomUUID();
			const startedAt = Date.now();
			logger.info({ requestId, method: request.method, path: new URL(request.url).pathname }, `[REQUEST] ${request.method} ${new URL(request.url).pathname}`);
			return { requestId, startedAt };
		})
		.onAfterHandle(({ request, set, requestId, startedAt }) => {
			set.headers["x-request-id"] = requestId;
			logger.info({ requestId, method: request.method, path: new URL(request.url).pathname, status: set.status, duration: Date.now() - startedAt }, `[RESPONSE] ${request.method} ${new URL(request.url).pathname} ${set.status}`);
		})
		.use(openapiPlugin)
		.onError(({ error, code, set, requestId }) => {
			if (error instanceof AppError) {
				set.status = error.status;
				return { success: false, error: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), ...(requestId ? { requestId } : {}) };
			}
			if (code === "VALIDATION") {
				set.status = 400;
				return { success: false, error: "VALIDATION_ERROR", message: "Validation failed", ...(requestId ? { requestId } : {}) };
			}
			if (code === "NOT_FOUND") {
				set.status = 404;
				return { success: false, error: "NOT_FOUND", message: "Resource not found", ...(requestId ? { requestId } : {}) };
			}
			logger.error({ requestId, code, error }, "Unhandled API error");
			set.status = 500;
			return { success: false, error: "INTERNAL_ERROR", message: env.NODE_ENV === "production" ? "An unexpected error occurred" : error instanceof Error ? error.message : "An unexpected error occurred", ...(requestId ? { requestId } : {}) };
		})
		.use(healthRoutes)
		.use(statusRoutes)
		.use(createExampleRoutes(enqueueExample))
		.use(createInternalNotificationRoutes({ workerNotificationApiKey: dependencies.workerNotificationApiKey ?? env.WORKER_NOTIFICATION_API_KEY ?? "", publish }));
}

export const app = createApp();
