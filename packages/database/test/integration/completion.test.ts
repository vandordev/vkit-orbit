import { expect, test } from "bun:test";
import { withPostgres } from "./harness";
import { completeFinalization, completeValidation, completeAnalysis } from "@repo/application";

test("completion records a durable notification and only one completion per run", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		await db.document.create({
			data: { id: "doc_one", workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1, status: "READY" },
		});
		await db.processingRun.create({
			data: { id: "run_one", workspaceId: "ws_one", documentId: "doc_one", revision: 1, status: "FINALIZING", result: { title: "One" } },
		});
		const input = {
			workspaceId: "ws_one",
			runId: "run_one",
			revision: 1,
			artifact: { id: "art_one", documentId: "doc_one", objectKey: "result-one", contentType: "application/json", byteSize: 2 },
		};
		const completed = await Promise.all([
			completeFinalization(input, db),
			completeFinalization({ ...input, artifact: { ...input.artifact, id: "art_raced" } }, db),
		]);
		expect(completed.filter(Boolean)).toHaveLength(1);
		expect(await db.documentArtifact.count({ where: { processingRunId: "run_one", kind: "RESULT" } })).toBe(1);
		expect(await completeFinalization(input, db)).toBe(false);
		const intents = await db.queueOutbox.findMany({ where: { contract: "notification.publish.v1" } });
		expect(intents).toHaveLength(1);
		const event = await db.auditLog.findUnique({ where: { id: (intents[0]!.payload as { eventId: string }).eventId } });
		expect(event?.metadata).toMatchObject({
			type: "document.processing.updated",
			workspaceId: "ws_one",
			documentId: "doc_one",
			runId: "run_one",
		});
	});
}, 60_000);

test("stage completion does not revive a run canceled after its initial read", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "ws_one", name: "One", slug: "one" } });
		await db.document.create({ data: { id: "doc_one", workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1 } });
		for (const status of ["VALIDATING", "ANALYZING"] as const) {
			const run = await db.processingRun.create({
				data: { id: `run_${status}`, workspaceId: "ws_one", documentId: "doc_one", revision: status === "VALIDATING" ? 1 : 2, status },
			});
			const racingDb = {
				processingRun: {
					findFirst: async () => {
						await db.processingRun.update({ where: { id: run.id }, data: { status: "CANCELED" } });
						return run;
					},
				},
				$transaction: db.$transaction.bind(db),
			};
			const input = { workspaceId: "ws_one", runId: run.id, revision: 1, report: {} };
			if (status === "VALIDATING") await completeValidation(input, racingDb);
			else await completeAnalysis(input, racingDb);
			expect((await db.processingRun.findUniqueOrThrow({ where: { id: run.id } })).status).toBe("CANCELED");
		}
	});
}, 60_000);
