import { Elysia } from "elysia";

import { env } from "../lib/env";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";
import { ForbiddenError, IdempotencyConflictError, NotFoundError, UnauthorizedError } from "@repo/application";

export const errorEnvelopePlugin = new Elysia({ name: "error-envelope" })
	.onError((context) => {
		const { error, code, set } = context;
		const requestId = "requestId" in context ? context.requestId : undefined;
		if (error instanceof AppError) {
			set.status = error.status;
			return {
				success: false,
				error: error.code,
				message: error.message,
				...(error.details ? { details: error.details } : {}),
				...(requestId ? { requestId } : {}),
			};
		}
		if (error instanceof IdempotencyConflictError) {
			set.status = 409;
			return { success: false, error: error.code, message: error.message, ...(requestId ? { requestId } : {}) };
		}
		if (error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof NotFoundError) {
			const status = error instanceof UnauthorizedError ? 401 : error instanceof ForbiddenError ? 403 : 404;
			set.status = status;
			return { success: false, error: error.code, message: "Resource unavailable", ...(requestId ? { requestId } : {}) };
		}
		if (code === "VALIDATION") {
			set.status = 422;
			return { success: false, error: "VALIDATION_ERROR", message: "Validation failed", ...(requestId ? { requestId } : {}) };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { success: false, error: "NOT_FOUND", message: "Resource not found", ...(requestId ? { requestId } : {}) };
		}
		logger.error({ requestId, code, error }, "Unhandled API error");
		set.status = 500;
		return {
			success: false,
			error: "INTERNAL_ERROR",
			message:
				env.NODE_ENV === "production"
					? "An unexpected error occurred"
					: error instanceof Error
						? error.message
						: "An unexpected error occurred",
			...(requestId ? { requestId } : {}),
		};
	})
	.as("global");
