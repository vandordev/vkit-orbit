import { z } from "zod";
import { loadConfigDocument } from "./loader";
import type { RawConfigDocument } from "./document";
import { interpolateSelected } from "./interpolation";
import { configError } from "./errors";
import { configFilePath } from "./paths";
import { databaseConfigSchema, publicSelectionSchema, runtimeSchemas, webhookConfigSchema, webToolConfigSchema, type RuntimeName, type RuntimeConfig } from "./schemas";

export type ConfigOptions = { filePath?: string; environment?: Readonly<Record<string, string | undefined>> };
const publicSelection = (raw: RawConfigDocument) => ({ app: { environment: raw.app.environment }, realtime: { publicUrl: raw.realtime.publicUrl } });
const selectors = {
	web: (raw: RawConfigDocument) => ({ app: raw.app, web: raw.web, database: raw.database, storage: raw.storage, webhook: raw.webhook, realtime: { publicUrl: raw.realtime.publicUrl, ticketSecret: raw.realtime.ticketSecret } }),
	api: (raw: RawConfigDocument) => ({ app: raw.app, api: raw.api, database: raw.database, storage: raw.storage, webhook: raw.webhook, worker: { notificationApiKey: raw.worker.notificationApiKey }, realtime: { internalUrl: raw.realtime.internalUrl, publishApiKey: raw.realtime.publishApiKey } }),
	worker: (raw: RawConfigDocument) => ({ app: raw.app, database: raw.database, redis: raw.redis, storage: raw.storage, webhook: raw.webhook, worker: raw.worker }),
	scheduler: (raw: RawConfigDocument) => ({ app: raw.app, redis: raw.redis }),
	realtime: (raw: RawConfigDocument) => ({ app: raw.app, realtime: { host: raw.realtime.host, port: raw.realtime.port, corsOrigin: raw.realtime.corsOrigin, ticketSecret: raw.realtime.ticketSecret, publishApiKey: raw.realtime.publishApiKey } }),
	migrate: (raw: RawConfigDocument) => ({ app: { environment: raw.app.environment }, database: raw.database }),
};
type Snapshot = { raw: RawConfigDocument; environment: Readonly<Record<string, string | undefined>>; filePath: string };
function snapshot(options: ConfigOptions, runtime = "structure"): Snapshot {
	const filePath = options.filePath ?? configFilePath();
	return { raw: loadConfigDocument(filePath, runtime), environment: { ...(options.environment ?? process.env) }, filePath };
}
function parse<S extends z.ZodType>(schema: S, selected: unknown, snapshot: Snapshot, runtime: string): z.output<S> {
	const diagnostic = { filePath: snapshot.filePath, runtime };
	const resolved = interpolateSelected(selected, snapshot.environment, diagnostic);
	const result = schema.safeParse(resolved);
	if (!result.success) throw configError(diagnostic, result.error.issues[0]?.path ?? [], "invalid value or incomplete credentials");
	return result.data;
}
function safeguards(snapshot: Snapshot, runtime: RuntimeName | "public" | "database", value: { app?: { environment: string }; environment?: string }): void {
	const environment = value.app?.environment ?? value.environment;
	const diagnostic = { filePath: snapshot.filePath, runtime };
	if (environment === "production" && ["web", "public"].includes(runtime) && !snapshot.environment.REALTIME_URL) throw configError(diagnostic, ["realtime", "publicUrl"], "production requires explicit REALTIME_URL");
	if (environment === "production" && ["web", "api", "worker", "migrate", "database"].includes(runtime) && !snapshot.environment.DATABASE_URL) throw configError(diagnostic, ["database", "url"], "production requires explicit DATABASE_URL");
	if (environment === "test" && ["worker", "scheduler"].includes(runtime) && !/^orbit:test:[a-z0-9][a-z0-9:_-]*$/i.test(snapshot.environment.REDIS_KEY_PREFIX ?? "")) throw configError(diagnostic, ["redis", "keyPrefix"], "test Redis requires explicit isolated orbit:test:<name> prefix");
}
export function loadRuntimeConfig<R extends RuntimeName>(runtime: R, options?: ConfigOptions): RuntimeConfig<R>;
export function loadRuntimeConfig(runtime: RuntimeName, options: ConfigOptions = {}): RuntimeConfig<RuntimeName> {
	const input = snapshot(options, runtime);
	const value = parse(runtimeSchemas[runtime], selectors[runtime](input.raw), input, runtime);
	safeguards(input, runtime, value);
	return value;
}
let processSnapshot: Snapshot | undefined;
function currentSnapshot(runtime: string): Snapshot { return processSnapshot ??= snapshot({}, runtime); }
function cached<T>(load: (input: Snapshot) => T, runtime: string): () => T {
	let value: { result: T } | undefined;
	return () => (value ??= { result: load(currentSnapshot(runtime)) }).result;
}
function getter<S extends z.ZodType<{ app: { environment: string } }>>(runtime: RuntimeName, schema: S) {
	return cached(input => {
		const value = parse(schema, selectors[runtime](input.raw), input, runtime);
		safeguards(input, runtime, value);
		return value;
	}, runtime);
}
export const getWebConfig = getter("web", runtimeSchemas.web);
export const getApiConfig = getter("api", runtimeSchemas.api);
export const getWorkerConfig = getter("worker", runtimeSchemas.worker);
export const getSchedulerConfig = getter("scheduler", runtimeSchemas.scheduler);
export const getRealtimeConfig = getter("realtime", runtimeSchemas.realtime);
export const getMigrateConfig = getter("migrate", runtimeSchemas.migrate);
const getters = { web: getWebConfig, api: getApiConfig, worker: getWorkerConfig, scheduler: getSchedulerConfig, realtime: getRealtimeConfig, migrate: getMigrateConfig };
export function getRuntimeConfig<R extends RuntimeName>(runtime: R): RuntimeConfig<R>;
export function getRuntimeConfig(runtime: RuntimeName): RuntimeConfig<RuntimeName> { return getters[runtime](); }
function databaseConfig(input: Snapshot) {
	const value = parse(databaseConfigSchema, { url: input.raw.database.url, environment: input.raw.app.environment }, input, "database");
	safeguards(input, "database", value);
	return value;
}
export const getDatabaseConfig = cached(databaseConfig, "database");
export const loadDatabaseConfig = (options: ConfigOptions = {}) => databaseConfig(snapshot(options, "database"));
export const getWebhookConfig = cached(input => parse(webhookConfigSchema, input.raw.webhook, input, "webhook"), "webhook");
function webToolConfig(input: Snapshot) { return parse(webToolConfigSchema, { app: input.raw.app, web: input.raw.web }, input, "web-tool"); }
export const getWebToolConfig = cached(webToolConfig, "web-tool");
export const loadWebToolConfig = (options: ConfigOptions = {}) => webToolConfig(snapshot(options, "web-tool"));
export function loadPublicWebConfig(options: ConfigOptions = {}) {
	return publicConfig(snapshot(options, "public"));
}
function publicConfig(input: Snapshot) {
	const value = parse(publicSelectionSchema, publicSelection(input.raw), input, "public");
	safeguards(input, "public", value);
	return { realtimeUrl: value.realtime.publicUrl };
}
export const getPublicWebConfig = cached(publicConfig, "public");
