import { createSchedulerConfig, createRedisConfig, resolvedConfigEnvironment } from "@repo/config";

import { runScheduler } from "./runtime";
import { createQueue } from "@repo/queue";
import { installSchedulers } from "./schedules";
import { log } from "./logger";

if (import.meta.main) {
	const environment = { ...process.env, ...resolvedConfigEnvironment(["base", "redis", "scheduler"]) };
	const config = createSchedulerConfig(environment);
	const redis = createRedisConfig(environment);
	const queue = createQueue("documents", redis);
	const webhooks = createQueue("webhooks", redis);
	try {
		await installSchedulers(queue, webhooks);
		log("info", { service: "scheduler", environment: config.NODE_ENV }, "scheduler started");
		await runScheduler({
			disconnect: async () => {
				await Promise.all([queue.close(), webhooks.close()]);
			},
		});
	} catch {
		await Promise.allSettled([queue.close(), webhooks.close()]);
		process.exitCode = 1;
	}
}
