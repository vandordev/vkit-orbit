import { createCommonConfig } from "./common";
import { z } from "zod";

export function createSchedulerConfig(runtimeEnv: Record<string, string | undefined>) {
  const common = createCommonConfig(runtimeEnv);
  return {
    ...common,
    ENABLE_EXAMPLE_SCHEDULE: z.preprocess((value) => value === true || value === "true", z.boolean().default(false)).parse(runtimeEnv.ENABLE_EXAMPLE_SCHEDULE),
    EXAMPLE_SCHEDULE_INTERVAL_MS: z.coerce.number().int().positive().default(300_000).parse(runtimeEnv.EXAMPLE_SCHEDULE_INTERVAL_MS),
  };
}

export type SchedulerConfig = ReturnType<typeof createSchedulerConfig>;
