import { expect, test } from "bun:test";
import { withPostgres } from "./harness";
import { claimStage, recoverProcessing, claimOutboxBatch, cleanupDocuments } from "@repo/application";

test("expired validation leases can be recovered on a retried run stage revision", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		await db.document.create({ data: { id: "doc_one", workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1 } });
		await db.processingRun.create({
			data: {
				id: "run_one",
				workspaceId: "ws_one",
				documentId: "doc_one",
				revision: 2,
				stageRevision: 1,
				status: "VALIDATING",
				leaseExpiresAt: new Date(0),
			},
		});
		await recoverProcessing({ limit: 1 }, db);
		expect(await claimStage({ workspaceId: "ws_one", runId: "run_one", revision: 1, stage: "VALIDATING" }, db)).toBe(true);
		expect(await claimStage({ workspaceId: "ws_one", runId: "run_one", revision: 1, stage: "VALIDATING" }, db)).toBe(false);
	});
}, 60_000);

test("targeted upload cleanup cannot delete another document's source", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		for (const id of ["doc_other", "doc_target"]) {
			await db.document.create({ data: { id, workspaceId: "ws_one", title: id, contentType: "text/plain", byteSize: 1 } });
			await db.documentArtifact.create({
				data: {
					id: `art_${id}`,
					workspaceId: "ws_one",
					documentId: id,
					objectKey: id,
					contentType: "text/plain",
					byteSize: 1,
					kind: "SOURCE",
					createdAt: new Date(0),
				},
			});
		}
		await cleanupDocuments({ limit: 1, before: new Date(), workspaceId: "ws_one", documentId: "doc_target" }, db);
		expect(await db.documentArtifact.count({ where: { documentId: "doc_other" } })).toBe(1);
		expect(await db.documentArtifact.count({ where: { documentId: "doc_target" } })).toBe(0);
	});
}, 60_000);

test("outbox relay recovers a crashed expired claim", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		await db.queueOutbox.create({
			data: {
				id: "outbox_one",
				workspaceId: "ws_one",
				contract: "document.validate.v1",
				businessId: "run_one",
				revision: 1,
				payload: { workspaceId: "ws_one", runId: "run_one", revision: 1 },
				status: "CLAIMED",
				claimedAt: new Date(0),
			},
		});
		expect(await claimOutboxBatch(1, db)).toHaveLength(1);
	});
}, 60_000);
