import { expect, test } from "bun:test";
import { withPostgres } from "../../../database/test/integration/harness";
import { submitProcessingRun } from "../../src";

test("submits a ready document with audit, idempotency, and outbox atomically", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "life_ws", name: "Lifecycle", slug: "lifecycle" } });
		await db.document.create({
			data: { id: "life_doc", workspaceId: "life_ws", title: "Readme", contentType: "text/plain", byteSize: 4, status: "READY" },
		});
		const run = await submitProcessingRun(
			{ workspaceId: "life_ws", principalId: "user" },
			{ documentId: "life_doc", idempotencyKey: "submit-1" },
			db,
		);
		expect(run.status).toBe("QUEUED");
		expect(await db.queueOutbox.findFirst({ where: { businessId: run.id, status: "PENDING" } })).not.toBeNull();
		expect(await db.auditLog.findFirst({ where: { action: "processing.submitted", resourceId: run.id } })).not.toBeNull();
		const replay = await submitProcessingRun(
			{ workspaceId: "life_ws", principalId: "user" },
			{ documentId: "life_doc", idempotencyKey: "submit-1" },
			db,
		);
		expect(replay.id).toBe(run.id);
	});
}, 30_000);
