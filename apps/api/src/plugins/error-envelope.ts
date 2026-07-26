import { Elysia } from "elysia";

import { env } from "../lib/env";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

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
