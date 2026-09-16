import { createSchedulerConfig } from "@repo/config";
import { prisma } from "@repo/database";

import { runScheduler } from "./runtime";
import { createQueue } from "@repo/queue";
import { installSchedulers } from "./schedules";

createSchedulerConfig(process.env);
const queue = createQueue("documents");
void runScheduler({
	register: () => {
		void installSchedulers(queue);
		return () => {
			void queue.close();
		};
	},
	disconnect: () => prisma.$disconnect(),
});
