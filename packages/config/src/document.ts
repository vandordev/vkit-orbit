import { z } from "zod";
import { configError, type Diagnostic } from "./errors";
import { validateTemplates } from "./interpolation";

const scalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);
// Explicit known-key ownership; runtime selectors never introspect schema internals.
export const rawConfigSchema = z.strictObject({
	app: z.strictObject({ environment: scalar, logLevel: scalar }),
	database: z.strictObject({ url: scalar }),
	web: z.strictObject({ host: scalar, port: scalar, origin: scalar }),
	api: z.strictObject({ host: scalar, port: scalar, corsOrigin: scalar, openapi: z.strictObject({ serverUrl: scalar, username: scalar.optional(), password: scalar.optional() }) }),
	redis: z.strictObject({ url: scalar, keyPrefix: scalar, connectTimeoutMs: scalar }),
	storage: z.strictObject({ bucket: scalar.optional(), region: scalar, accessKeyId: scalar.optional(), secretAccessKey: scalar.optional(), endpoint: scalar.optional(), rootPrefix: scalar }),
	realtime: z.strictObject({ publicUrl: scalar, host: scalar, port: scalar, corsOrigin: scalar, ticketSecret: scalar, internalUrl: scalar, publishApiKey: scalar }),
	worker: z.strictObject({ notificationUrl: scalar, notificationApiKey: scalar }),
	webhook: z.strictObject({ secretEncryptionKey: scalar.optional() }),
});
export type RawConfigDocument = z.output<typeof rawConfigSchema>;
export function validateConfigDocument(value: unknown, diagnostic: Diagnostic = { filePath: "input", runtime: "structure" }): RawConfigDocument {
	const result = rawConfigSchema.safeParse(value);
	if (!result.success) throw configError(diagnostic, result.error.issues[0]?.path ?? [], "unknown key or invalid document shape");
	validateTemplates(result.data, diagnostic);
	return result.data;
}
