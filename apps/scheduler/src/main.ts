import { createSchedulerConfig } from "@repo/config";
import { prisma } from "@repo/database";

import { runScheduler } from "./runtime";

createSchedulerConfig(process.env);
void runScheduler({ disconnect: () => prisma.$disconnect() });
