import { createHash, randomBytes } from "node:crypto";
import { getPrisma, type DatabaseClient } from "@repo/db";
import { validateWebhookUrl, type WebhookUrlPolicy } from "./safe-url";
import { runtimeWebhookSecretCrypto, type WebhookSecretCrypto } from "./secret";
export async function createWebhookEndpoint(
	input: { workspaceId: string; url: string; events: string[] },
	db: DatabaseClient = getPrisma(),
	options: { crypto?: WebhookSecretCrypto; urlPolicy?: WebhookUrlPolicy } = {},
) {
	await validateWebhookUrl(input.url, options.urlPolicy);
	if (!input.events.length || input.events.some((event) => event !== "document.processing.completed.v1"))
		throw new Error("Unsupported webhook event");
	const secret = randomBytes(32).toString("hex");
	const secretHash = createHash("sha256").update(secret).digest("hex");
	const encryptedSecret = (options.crypto ?? runtimeWebhookSecretCrypto()).encrypt(secret);
	const endpoint = await db.webhookEndpoint.create({
		data: {
			id: `wh_${crypto.randomUUID()}`,
			workspaceId: input.workspaceId,
			url: input.url,
			events: input.events,
			secretHash,
			encryptedSecret,
		},
	});
	return { endpoint, secret };
}
