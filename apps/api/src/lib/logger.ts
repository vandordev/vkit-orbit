import pino from "pino";
import { redact, safeLogContext } from "@repo/application";

import { getEnv } from "./env";

let logger: ReturnType<typeof pino> | undefined;
export function getLogger() {
if (logger) return logger;
const env = getEnv();
const isProduction = env.app.environment === "production";
logger = pino({
	level: env.app.logLevel,
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

return logger;
}

export function logContext(input: Record<string, unknown>) {
	return redact(safeLogContext(input));
}
