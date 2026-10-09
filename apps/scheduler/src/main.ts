import { getSchedulerConfig } from "@repo/config/server";

import { runScheduler } from "./runtime";
import { createQueue } from "@repo/queue";
import { installSchedulers } from "./schedules";
import { log } from "./logger";

if (import.meta.main) {
	const config = getSchedulerConfig();
	const redis = config.redis;
	const queue = createQueue("documents", redis);
	const webhooks = createQueue("webhooks", redis);
	try {
		await installSchedulers(queue, webhooks);
		log("info", { service: "scheduler", environment: config.app.environment }, "scheduler started");
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
