import { expect, test } from "bun:test";
import { createRedisConfig } from "./redis";

test("creates durable Redis connection settings", () => {
	const config = createRedisConfig({ REDIS_URL: "redis://redis:6379", REDIS_KEY_PREFIX: "hub:", REDIS_CONNECT_TIMEOUT_MS: "2500" });
	expect(config).toEqual({ url: "redis://redis:6379", keyPrefix: "hub:", connectTimeoutMs: 2500, maxRetriesPerRequest: null });
});
