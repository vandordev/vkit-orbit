import { z } from "zod";
import { realtimeOriginSchema } from "./public";

export const appEnvironmentSchema = z.enum(["development", "staging", "production", "test"]);
export type AppEnvironment = z.output<typeof appEnvironmentSchema>;
const text = z.string().min(1);
const optionalText = z.preprocess(value => value === "" ? undefined : value, text.optional());
const optionalUrl = z.preprocess(value => value === "" ? undefined : value, z.string().url().optional());
const numeric = z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).pipe(z.number().int());
const port = numeric.pipe(z.number().min(1).max(65535));
const app = z.strictObject({ environment: appEnvironmentSchema, logLevel: text });
const database = z.strictObject({ url: text.refine(value => { try { return ["postgresql:", "postgres:"].includes(new URL(value).protocol); } catch { return false; } }, "expected PostgreSQL URL") });
export const databaseConfigSchema = z.strictObject({ url: database.shape.url, environment: appEnvironmentSchema });
export type DatabaseConfig = z.output<typeof databaseConfigSchema>;
const web = z.strictObject({ host: text, port, origin: z.string().url() });
const openapi = z.strictObject({ serverUrl: z.string().url(), username: optionalText, password: optionalText }).refine(value => Boolean(value.username) === Boolean(value.password), "documentation credentials must be paired");
const api = z.strictObject({ host: text, port, corsOrigin: z.string().url(), openapi });
const redis = z.strictObject({ url: z.string().url().refine(value => ["redis:", "rediss:"].includes(new URL(value).protocol)), keyPrefix: text, connectTimeoutMs: numeric.pipe(z.number().min(1).max(2147483647)) }).transform(value => ({ ...value, maxRetriesPerRequest: null }));
const storage = z.strictObject({ bucket: optionalText, region: text, accessKeyId: optionalText, secretAccessKey: optionalText, endpoint: optionalUrl, rootPrefix: text }).transform((value, ctx) => {
	const { bucket, accessKeyId, secretAccessKey } = value;
	if (!bucket && !accessKeyId && !secretAccessKey) return null;
	if (!bucket || !accessKeyId || !secretAccessKey) { ctx.addIssue({ code: "custom", message: "storage credentials must be complete" }); return z.NEVER; }
	return { ...value, bucket, accessKeyId, secretAccessKey };
});
export const webhookConfigSchema = z.strictObject({ secretEncryptionKey: z.preprocess(value => value === "" ? undefined : value, z.string().regex(/^[a-f0-9]{64}$/i).optional()) });
export const publicSelectionSchema = z.strictObject({ app: z.strictObject({ environment: appEnvironmentSchema }), realtime: z.strictObject({ publicUrl: realtimeOriginSchema }) });
export const runtimeSchemas = {
	web: z.strictObject({ app, web, database, storage, webhook: webhookConfigSchema, realtime: z.strictObject({ publicUrl: realtimeOriginSchema, ticketSecret: text }) }),
	api: z.strictObject({ app, api, database, storage, webhook: webhookConfigSchema, worker: z.strictObject({ notificationApiKey: optionalText }), realtime: z.strictObject({ internalUrl: optionalUrl, publishApiKey: optionalText }) }).refine(value => { const fields = [value.worker.notificationApiKey, value.realtime.internalUrl, value.realtime.publishApiKey]; return !fields.some(Boolean) || fields.every(Boolean); }, "publisher credentials must be complete"),
	worker: z.strictObject({ app, database, redis, storage, webhook: webhookConfigSchema, worker: z.strictObject({ notificationUrl: z.string().url(), notificationApiKey: text }) }),
	scheduler: z.strictObject({ app, redis }),
	realtime: z.strictObject({ app, realtime: z.strictObject({ host: text, port, corsOrigin: z.string().url(), ticketSecret: text, publishApiKey: text }) }),
	migrate: z.strictObject({ database, app: z.strictObject({ environment: appEnvironmentSchema }) }),
} as const;
export type RuntimeName = keyof typeof runtimeSchemas;
export type RuntimeConfig<R extends RuntimeName> = z.output<(typeof runtimeSchemas)[R]>;
