import { expect, test } from "bun:test";
import { withPostgres } from "./harness";

test("enforces workspace-qualified document and outbox identities", async () => {
	await withPostgres(async (db) => {
		await db.workspace.createMany({
			data: [
				{ id: "ws_one", name: "One", slug: "one" },
				{ id: "ws_two", name: "Two", slug: "two" },
			],
		});
		await db.document.create({ data: { id: "doc_one", workspaceId: "ws_one", title: "One", contentType: "text/plain", byteSize: 1 } });
		await expect(
			Promise.resolve(db.processingRun.create({ data: { id: "run_bad", workspaceId: "ws_two", documentId: "doc_one", revision: 1 } })),
		).rejects.toThrow();
		await db.queueOutbox.create({
			data: { id: "outbox_one", workspaceId: "ws_one", contract: "document.validate.v1", businessId: "run_one", revision: 1, payload: {} },
		});
		await expect(
			Promise.resolve(
				db.queueOutbox.create({
					data: {
						id: "outbox_two",
						workspaceId: "ws_one",
						contract: "document.validate.v1",
						businessId: "run_one",
						revision: 1,
						payload: {},
					},
				}),
			),
		).rejects.toThrow();
	});
});
