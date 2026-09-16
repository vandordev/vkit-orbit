import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/database";
import { createStorageConfig } from "@repo/config";
import { createStorageClient } from "@repo/storage";

const fail = (message: string): never => {
	throw new Error(`system smoke: ${message}`);
};
const check: (condition: unknown, message: string) => asserts condition = (condition, message) => {
	if (!condition) fail(message);
};
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
const storageConfig = createStorageConfig(process.env);
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
console.info("Public API, atomic idempotency, MinIO bytes, worker processing, duplicate artifact, and authorization scenarios passed.");
