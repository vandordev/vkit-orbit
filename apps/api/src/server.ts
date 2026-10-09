import { getEnv } from "./lib/env";
import { getLogger } from "./lib/logger";
import { createApp } from "./app";

if (import.meta.main) {
const env = getEnv();
const app = createApp();
app.listen({ port: env.api.port, hostname: env.api.host });

getLogger().info(
	{
		port: env.api.port,
		environment: env.app.environment,
	},
	"Reusable Elysia API boundary started",
);

}
export type Server = ReturnType<typeof createApp>;
