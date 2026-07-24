import { createCommonConfig } from "./common";

export function createSchedulerConfig(runtimeEnv: Record<string, string | undefined>) {
  const common = createCommonConfig(runtimeEnv);
  return {
    ...common,
  };
}

export type SchedulerConfig = ReturnType<typeof createSchedulerConfig>;
