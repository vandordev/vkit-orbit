import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { assertProductionDatabaseConfig, commonServer } from "./common";
import { createStorageConfig, storageServer } from "./storage";

const apiServer = {
  ...commonServer,
  ...storageServer,
  PORT: z.coerce.number().int().positive().default(4100),
  CORS_ORIGIN: z.string().url().default("http://localhost:4100"),
  OPENAPI_SERVER_URL: z.string().url().default("http://localhost:4100"),
  OPENAPI_BASIC_AUTH_USERNAME: z.string().min(1).optional(),
  OPENAPI_BASIC_AUTH_PASSWORD: z.string().min(1).optional(),
  WORKER_NOTIFICATION_API_KEY: z.string().min(1).optional(),
  REALTIME_INTERNAL_URL: z.string().url().optional(),
  REALTIME_PUBLISH_API_KEY: z.string().min(1).optional(),
} as const;

export function createApiConfig(
  runtimeEnv: Record<string, string | undefined>,
) {
  const parsed = createEnv({
    server: apiServer,
    runtimeEnv,
    isServer: true,
    emptyStringAsUndefined: true,
  });

  assertProductionDatabaseConfig(parsed.NODE_ENV, runtimeEnv);

  if (Boolean(parsed.OPENAPI_BASIC_AUTH_USERNAME) !== Boolean(parsed.OPENAPI_BASIC_AUTH_PASSWORD)) {
    throw new Error("OPENAPI_BASIC_AUTH_USERNAME and OPENAPI_BASIC_AUTH_PASSWORD must be configured together");
  }

  const realtimeValues = [parsed.WORKER_NOTIFICATION_API_KEY, parsed.REALTIME_INTERNAL_URL, parsed.REALTIME_PUBLISH_API_KEY];
  if (realtimeValues.some(Boolean) && realtimeValues.some((value) => !value)) {
    throw new Error("WORKER_NOTIFICATION_API_KEY, REALTIME_INTERNAL_URL, and REALTIME_PUBLISH_API_KEY must be configured together");
  }

  return {
    ...parsed,
    port: parsed.PORT,
    corsOrigin: parsed.CORS_ORIGIN,
    openapiServerUrl: parsed.OPENAPI_SERVER_URL,
    storage: createStorageConfig(parsed),
  };
}

export type ApiConfig = ReturnType<typeof createApiConfig>;
