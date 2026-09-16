import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/database";
export async function createWebhookEndpoint(input: { workspaceId: string; url: string; events: string[] }, db: any = prisma) {
	const secret = randomBytes(32).toString("hex");
	const secretHash = createHash("sha256").update(secret).digest("hex");
	const endpoint = await db.webhookEndpoint.create({
		data: { id: `wh_${crypto.randomUUID()}`, workspaceId: input.workspaceId, url: input.url, events: input.events, secretHash },
	});
	return { endpoint, secret };
}
