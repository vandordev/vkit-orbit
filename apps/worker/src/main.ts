import { prisma } from "@repo/database";
import { createWorkerRuntime } from "./runtime";
import { createHealthServer } from "./server";

const worker = createWorkerRuntime({ handlers: {} });
createHealthServer({ isReady: () => worker.isRunning() }).listen();
