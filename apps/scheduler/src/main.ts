import { createSchedulerConfig } from "@repo/config";
import { prisma } from "@repo/database";

import { runScheduler } from "./runtime";
import { createQueue } from "@repo/queue";
import { installSchedulers } from "./schedules";
import { log } from "./logger";

createSchedulerConfig(process.env);
const queue = createQueue("documents");
log("info", { service: "scheduler", environment: process.env.NODE_ENV ?? "development" }, "scheduler started");
void runScheduler({
	register: () => {
		void installSchedulers(queue);
		return () => {
			void queue.close();
		};
	},
	disconnect: () => prisma.$disconnect(),
});
