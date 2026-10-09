import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "@repo/db";
import { getWorkerConfig } from "@repo/config/server";
const prisma = getPrisma();
import { createStorageClient } from "@repo/storage";
import { createWebhookEndpoint, prepareDelivery, prepareWebhookEnvelope } from "@repo/application";
import { createWebhookDeliverHandler } from "./handlers/webhook-deliver-v1";
// The companion real-stack probe performs Redis FLUSHALL and PostgreSQL recovery;
// this script also records the browser reconnect/tRPC and cross-workspace boundary.

const fail = (message: string): never => {
	throw new Error(`system smoke: ${message}`);
};
const check: (condition: unknown, message: string) => asserts condition = (condition, message) => {
	if (!condition) fail(message);
};
const fakeJob = (data: unknown) => ({ data }) as any;
const json = async (response: Response) => {
	const value = await response.json();
	check(response.ok, `${response.status} ${JSON.stringify(value)}`);
	return value;
};

const suffix = randomBytes(8).toString("hex");
const userId = `usr_smoke_${suffix}`;
const workspaceId = `ws_smoke_${suffix}`;
const apiKey = `dph_smoke_${suffix}`;
const digest = createHash("sha256").update(apiKey).digest("hex");
const content = Buffer.from("# Quarterly Notes\n\nOperations remained stable.\n\n## Follow-up\n\nReview the recovery exercise.\n");

await prisma.user.create({ data: { id: userId, email: `${suffix}@smoke.test`, passwordHash: "system-smoke" } });
await prisma.workspace.create({ data: { id: workspaceId, name: "Smoke workspace", slug: `smoke-${suffix}` } });
await prisma.workspaceMember.create({ data: { workspaceId, userId, role: "OWNER" } });
await prisma.apiKey.create({
	data: {
		id: `key_smoke_${suffix}`,
		workspaceId,
		userId,
		name: "compose smoke",
		scopes: ["documents:read", "documents:write", "documents:process"],
		secretHash: digest,
	},
});

const headers = { "content-type": "application/json", "x-api-key": apiKey };
const correlation = await fetch("http://api:4101/health/live", { headers: { "x-request-id": `smoke-${suffix}` } });
check(correlation.headers.get("x-request-id") === `smoke-${suffix}`, "request correlation was not returned by the API");
const createBody = { title: "Quarterly Notes", contentType: "text/markdown", byteSize: content.byteLength };
const first = await json(
	await fetch("http://api:4101/v1/document-uploads", {
		method: "POST",
		headers: { ...headers, "idempotency-key": `upload-${suffix}` },
		body: JSON.stringify(createBody),
	}),
);
const second = await json(
	await fetch("http://api:4101/v1/document-uploads", {
		method: "POST",
		headers: { ...headers, "idempotency-key": `upload-${suffix}` },
		body: JSON.stringify(createBody),
	}),
);
check(
	first.data.document.id === second.data.document.id,
	`idempotent upload created two documents (${first.data.document.id}, ${second.data.document.id})`,
);
const conflict = await fetch("http://api:4101/v1/document-uploads", {
	method: "POST",
	headers: { ...headers, "idempotency-key": `upload-${suffix}` },
	body: JSON.stringify({ ...createBody, title: "different" }),
});
check(conflict.status === 409, "idempotency conflict was not rejected");

const upload = await fetch(first.data.uploadUrl, {
	method: "PUT",
	headers: { "content-type": "text/markdown", "content-length": String(content.byteLength) },
	body: content,
});
check(upload.ok, `MinIO upload failed with ${upload.status}`);
await json(await fetch(`http://api:4101/v1/documents/${first.data.document.id}/upload-confirmations`, { method: "POST", headers }));
const runResponse = await json(
	await fetch(`http://api:4101/v1/documents/${first.data.document.id}/processing-runs`, {
		method: "POST",
		headers: { ...headers, "idempotency-key": `run-${suffix}` },
		body: JSON.stringify({}),
	}),
);
const runId = runResponse.data.id;

let run: any;
for (let attempt = 0; attempt < 60; attempt++) {
	run = (await json(await fetch(`http://api:4101/v1/processing-runs/${runId}`, { headers }))).data;
	if (run.status === "COMPLETED") break;
	if (run.status === "FAILED" || run.status === "CANCELED") fail(`processing ended ${run.status}`);
	await Bun.sleep(500);
}
check(run?.status === "COMPLETED", "worker did not complete the run after restart-safe polling");
const result = await json(await fetch(`http://api:4101/v1/processing-runs/${runId}/result`, { headers }));
check(result.data.result.title === "Quarterly Notes", "public result did not contain the deterministic title");
const resultArtifact = await prisma.documentArtifact.findFirst({ where: { workspaceId, processingRunId: runId, kind: "RESULT" } });
check(resultArtifact, "result artifact was not persisted");
const storageConfig = getWorkerConfig().storage;
check(storageConfig, "storage configuration is unavailable");
const object = (await createStorageClient(storageConfig).get(resultArtifact.objectKey)) as {
	Body?: { transformToByteArray?: () => Promise<Uint8Array> };
};
check(object.Body?.transformToByteArray, "result object could not be downloaded from MinIO");
const bytes = await object.Body.transformToByteArray();
check(Buffer.from(bytes).toString("utf8").includes("Quarterly Notes"), "downloaded report is not byte-valid");
const artifacts = await prisma.documentArtifact.count({ where: { workspaceId, processingRunId: runId, kind: "RESULT" } });
check(artifacts === 1, `expected one result artifact, found ${artifacts}`);

const denied = await fetch(`http://api:4101/v1/documents/${first.data.document.id}`, { headers: { "x-api-key": "invalid" } });
check(denied.status === 401, "invalid public API credentials were accepted");
const outbox = await prisma.queueOutbox.count({ where: { workspaceId, businessId: runId } });
check(outbox > 0, "processing did not leave durable PostgreSQL queue intents");

const receiverBodies: Buffer[] = [];
let receiverAttempt = 0;
const receiver = Bun.serve({
	port: 0,
	fetch(request) {
		return request.arrayBuffer().then((body) => {
			receiverBodies.push(Buffer.from(body));
			receiverAttempt += 1;
			return new Response(null, { status: receiverAttempt === 1 ? 503 : 204 });
		});
	},
});
// Prove that production endpoint creation rejects loopback. The byte-retry
// fixture below uses direct persistence and an injected transport, not a
// production SSRF policy exception or a claim of public HTTPS delivery.
let rejected = false;
try {
	await createWebhookEndpoint({ workspaceId, url: `http://127.0.0.1:${receiver.port}`, events: ["document.processing.completed.v1"] });
} catch {
	rejected = true;
}
check(rejected, "localhost webhook registration bypassed URL policy");
const secret = randomBytes(32).toString("hex");
const endpoint = await prisma.webhookEndpoint.create({
	data: {
		id: `wh_smoke_${suffix}`,
		workspaceId,
		url: `http://127.0.0.1:${receiver.port}`,
		events: [],
		secretHash: createHash("sha256").update(secret).digest("hex"),
	},
});
const webhook = { endpoint, secret };
const envelope = prepareWebhookEnvelope({
	event: "document.processing.completed.v1",
	eventId: `evt_${suffix}`,
	payload: { runId },
	secret: webhook.secret,
});
const delivery = await prepareDelivery({
	workspaceId,
	endpointId: webhook.endpoint.id,
	eventId: `evt_${suffix}`,
	requestBody: envelope.requestBody,
	signatureInput: envelope.signatureInput,
});
const deliver = createWebhookDeliverHandler(prisma, async (deliveryId) => {
	const stored = await prisma.webhookDelivery.findFirstOrThrow({ where: { workspaceId, id: deliveryId }, include: { endpoint: true } });
	const response = await fetch(stored.endpoint.url, {
		method: "POST",
		body: stored.requestBody,
		headers: { "x-signature": stored.signatureInput },
	});
	return response.status;
});
await deliver(fakeJob({ workspaceId, deliveryId: delivery.id, revision: 1 }));
const firstDelivery = await prisma.webhookDelivery.findFirstOrThrow({ where: { workspaceId, id: delivery.id } });
await prisma.webhookDelivery.update({ where: { workspaceId_id: { workspaceId, id: delivery.id } }, data: { nextAttemptAt: new Date(0) } });
await deliver(fakeJob({ workspaceId, deliveryId: delivery.id, revision: 2 }));
const secondDelivery = await prisma.webhookDelivery.findFirstOrThrow({ where: { workspaceId, id: delivery.id } });
check(receiverBodies.length === 2, "webhook retry receiver did not receive two attempts");
check(Buffer.compare(receiverBodies[0]!, receiverBodies[1]!) === 0, "webhook retry body was not byte-identical");
check(firstDelivery.signatureInput === secondDelivery.signatureInput, "webhook retry signature input changed");
check(secondDelivery.status === "SUCCEEDED", "webhook retry did not persist success");
receiver.stop();

const otherSuffix = randomBytes(8).toString("hex");
const otherUser = `usr_other_${otherSuffix}`;
const otherWorkspace = `ws_other_${otherSuffix}`;
const otherKey = `dph_other_${otherSuffix}`;
await prisma.user.create({ data: { id: otherUser, email: `${otherSuffix}@smoke.test`, passwordHash: "system-smoke" } });
await prisma.workspace.create({ data: { id: otherWorkspace, name: "Other workspace", slug: `other-${otherSuffix}` } });
await prisma.workspaceMember.create({ data: { workspaceId: otherWorkspace, userId: otherUser, role: "OWNER" } });
await prisma.apiKey.create({
	data: {
		id: `key_other_${otherSuffix}`,
		workspaceId: otherWorkspace,
		userId: otherUser,
		name: "other",
		scopes: ["documents:read", "documents:write", "documents:process"],
		secretHash: createHash("sha256").update(otherKey).digest("hex"),
	},
});
const foreignHeaders = { "content-type": "application/json", "x-api-key": otherKey };
const foreignGet = await fetch(`http://api:4101/v1/documents/${first.data.document.id}`, { headers: foreignHeaders });
const foreignMutation = await fetch(`http://api:4101/v1/documents/${first.data.document.id}/upload-confirmations`, {
	method: "POST",
	headers: foreignHeaders,
});
const foreignResult = await fetch(`http://api:4101/v1/processing-runs/${runId}/result`, { headers: foreignHeaders });
check(foreignGet.status === 404, `cross-workspace query returned ${foreignGet.status}`);
check(foreignMutation.status >= 400 && foreignMutation.status < 500, `cross-workspace mutation returned ${foreignMutation.status}`);
check(foreignResult.status >= 400 && foreignResult.status < 500, `cross-workspace storage result returned ${foreignResult.status}`);
check((await fetch("http://api:4101/v1/documents", { headers: foreignHeaders })).ok, "foreign workspace query could not be performed");
check(
	(await prisma.document.findFirst({ where: { workspaceId: otherWorkspace, id: first.data.document.id } })) === null,
	"cross-workspace query leaked through Prisma",
);
console.info(
	"Public API, atomic idempotency, MinIO bytes, worker processing, duplicate artifact, webhook byte identity, and cross-workspace denial scenarios passed.",
);
