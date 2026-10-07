import { createHmac, randomUUID } from "node:crypto";
import { prisma, type DatabaseConnection } from "@repo/database";
export function signWebhook(secret: string, body: Uint8Array | string): string {
	return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}
export function prepareWebhookEnvelope(input: { event: string; eventId: string; payload: unknown; secret: string }) {
	const requestBody = Buffer.from(JSON.stringify({ event: input.event, id: input.eventId, data: input.payload }));
	const signatureInput = signWebhook(input.secret, requestBody);
	return { requestBody, signatureInput };
}
export async function prepareDelivery(
	input: { workspaceId: string; endpointId: string; eventId: string; requestBody: Uint8Array; signatureInput: string },
	db: DatabaseConnection = prisma,
) {
	return db.webhookDelivery.upsert({
		where: { workspaceId_endpointId_eventId: { workspaceId: input.workspaceId, endpointId: input.endpointId, eventId: input.eventId } },
		create: { id: `delivery_${randomUUID()}`, ...input, requestBody: Buffer.from(input.requestBody) },
		update: {},
	});
}
