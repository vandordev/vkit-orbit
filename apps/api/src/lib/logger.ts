import pino from "pino";
import { redact, safeLogContext } from "@repo/application";

import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
	level: env.LOG_LEVEL || (isProduction ? "info" : "debug"),
	transport: isProduction
		? undefined
		: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss Z",
					ignore: "pid,hostname",
				},
			},
	serializers: { obj: (value: unknown) => redact(value) },
	redact: ["req.headers.authorization", "req.headers.cookie", "req.headers.x-api-key", "*.databaseUrl", "*.redisUrl"],
	timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

export function logContext(input: Record<string, unknown>) {
	return redact(safeLogContext(input));
}
