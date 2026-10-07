import { z } from "zod";
import { resolvedConfigEnvironment } from "./run";

export function createWebhookConfig(environment: Record<string, string | undefined> = process.env) {
	const resolved = resolvedConfigEnvironment(["webhook"], environment);
	return z
		.object({
			WEBHOOK_SECRET_ENCRYPTION_KEY: z
				.string()
				.regex(/^[a-f0-9]{64}$/i)
				.optional(),
		})
		.parse({
			WEBHOOK_SECRET_ENCRYPTION_KEY: resolved.WEBHOOK_SECRET_ENCRYPTION_KEY || undefined,
		});
}
