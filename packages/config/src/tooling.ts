import type { DatabaseConfig, RuntimeConfig } from "./schemas";
export function webToolEnvironment(config: Pick<RuntimeConfig<"web">, "web" | "app">) {
	return { PORT: String(config.web.port), HOSTNAME: config.web.host, NODE_ENV: config.app.environment };
}
export function prismaToolEnvironment(config: DatabaseConfig) {
	return { DATABASE_URL: config.url, NODE_ENV: config.environment };
}
