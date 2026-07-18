import { createSchedulerConfig } from "@repo/config";
import { prisma } from "@repo/database";
import { createRiverClient } from "@repo/queue";

import { registerSchedules } from "./schedules";

const config = createSchedulerConfig(process.env);
const river = createRiverClient(prisma);
const stopSchedules = registerSchedules(river);

function shutdown() {
	stopSchedules();
	void prisma.$disconnect().finally(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

void config;
