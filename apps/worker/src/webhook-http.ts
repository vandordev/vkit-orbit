import { request } from "node:https";
import type { DatabaseClient } from "@repo/database";
import { validateWebhookUrl, type WebhookTarget } from "@repo/application";

const MAX_BYTES = 256 * 1024;

// DNS is resolved and validated once, then pinned into the socket lookup.
// The original hostname remains the TLS/Host identity. Redirects are not followed.
export function requestWebhook(target: WebhookTarget, body: Uint8Array, signature: string): Promise<number> {
	if (body.byteLength > MAX_BYTES) return Promise.resolve(413);
	return new Promise((resolve) => {
		let settled = false;
		const finish = (status: number) => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				resolve(status);
			}
		};
		const req = request(
			target.url,
			{
				method: "POST",
				lookup: (_host, options, callback) => {
					if (typeof options === "object" && options.all) callback(null, [{ address: target.address, family: target.family }]);
					else callback(null, target.address, target.family);
				},
				headers: { "content-type": "application/json", "content-length": body.byteLength, "x-signature": signature },
			},
			(response) => {
				let bytes = 0;
				response.on("data", (chunk: Buffer) => {
					bytes += chunk.byteLength;
					if (bytes > MAX_BYTES) {
						response.destroy();
						finish(413);
					}
				});
				response.on("end", () => finish(response.statusCode ?? 500));
				response.on("error", () => finish(503));
			},
		);
		const timer = setTimeout(() => {
			req.destroy();
			finish(408);
		}, 5000);
		req.on("error", () => finish(503));
		req.end(Buffer.from(body));
	});
}

export async function sendStoredWebhook(db: DatabaseClient, deliveryId: string): Promise<number | "network"> {
	const delivery = await db.webhookDelivery.findUnique({ where: { id: deliveryId }, include: { endpoint: true } });
	if (!delivery || !delivery.endpoint.active) return 410;
	try {
		const target = await validateWebhookUrl(delivery.endpoint.url);
		return await requestWebhook(target, delivery.requestBody, delivery.signatureInput);
	} catch (error) {
		return error instanceof Error && (error.message === "WEBHOOK_URL_REJECTED" || error instanceof TypeError) ? 400 : "network";
	}
}
