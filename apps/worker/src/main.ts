import { prisma } from "@repo/database";
import { createWorkerRuntime } from "./runtime";
import { createHealthServer } from "./server";
import { log } from "./logger";

const worker = createWorkerRuntime({ handlers: {} });
log("info", { service: "worker", environment: process.env.NODE_ENV ?? "development" }, "worker started");
createHealthServer({ isReady: () => worker.isRunning() }).listen();
