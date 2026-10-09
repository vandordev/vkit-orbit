export { getApiConfig as getEnv } from "@repo/config/server";
export type Env = import("@repo/config/server").RuntimeConfig<"api">;
