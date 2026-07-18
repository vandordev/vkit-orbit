import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { assertProductionDatabaseConfig, commonServer } from "./common";
import { createStorageConfig, storageServer } from "./storage";

export function createWorkerConfig(runtimeEnv: Record<string, string | undefined>) {
  const parsed = createEnv({
    server: {
      ...commonServer,
      ...storageServer,
      WORKER_NOTIFICATION_URL: z.string().url().default("http://localhost:4100/api/internal/worker-events"),
      WORKER_NOTIFICATION_API_KEY: z.string().min(1).default("local-worker-key"),
    },
    runtimeEnv,
    isServer: true,
    emptyStringAsUndefined: true,
  });

  assertProductionDatabaseConfig(parsed.NODE_ENV, runtimeEnv);

  return { ...parsed, storage: createStorageConfig(parsed) };
}

export type WorkerConfig = ReturnType<typeof createWorkerConfig>;
