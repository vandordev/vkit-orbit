import { expect, test } from "bun:test";
import { createRedisConfig } from "./redis";

test("creates durable Redis connection settings", () => {
	const config = createRedisConfig({ REDIS_URL: "redis://redis:6379", REDIS_KEY_PREFIX: "hub:", REDIS_CONNECT_TIMEOUT_MS: "2500" });
	expect(config).toEqual({ url: "redis://redis:6379", keyPrefix: "hub:", connectTimeoutMs: 2500, maxRetriesPerRequest: null });
});

test("test Redis requires an isolated explicit prefix and a Redis protocol", () => {
	for (const env of [
		{ NODE_ENV: "test", REDIS_URL: "redis://localhost:6379" },
		{ NODE_ENV: "test", REDIS_KEY_PREFIX: "dph:" },
		{ NODE_ENV: "test", REDIS_KEY_PREFIX: "orbit:test" },
		{ NODE_ENV: "test", REDIS_URL: "https://redis.test", REDIS_KEY_PREFIX: "orbit:test:one" },
	])
		expect(() => createRedisConfig(env)).toThrow();
	expect(createRedisConfig({ NODE_ENV: "test", REDIS_KEY_PREFIX: "orbit:test:one" }).keyPrefix).toBe("orbit:test:one");
});
