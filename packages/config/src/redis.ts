import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const redisServer = {
	REDIS_URL: z.string().url().default("redis://localhost:6379"),
	REDIS_KEY_PREFIX: z.string().min(1).default("dph:"),
	REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
} as const;

export function createRedisConfig(runtimeEnv: Record<string, string | undefined>) {
	const parsed = createEnv({ server: redisServer, runtimeEnv, isServer: true, emptyStringAsUndefined: true });
	if (!["redis:", "rediss:"].includes(new URL(parsed.REDIS_URL).protocol)) throw new Error("Redis URL must use redis:// or rediss://");
	if (
		runtimeEnv.NODE_ENV === "test" &&
		(!runtimeEnv.REDIS_KEY_PREFIX || !/^orbit:test:[a-z0-9][a-z0-9:_-]*$/i.test(runtimeEnv.REDIS_KEY_PREFIX))
	) {
		throw new Error("Test Redis requires an explicit isolated orbit:test:<name> prefix");
	}
	return {
		url: parsed.REDIS_URL,
		keyPrefix: parsed.REDIS_KEY_PREFIX,
		connectTimeoutMs: parsed.REDIS_CONNECT_TIMEOUT_MS,
		maxRetriesPerRequest: null,
	};
}

export type RedisConfig = ReturnType<typeof createRedisConfig>;
