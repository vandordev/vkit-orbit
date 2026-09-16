import { expect, test } from "bun:test";
import { withPostgres } from "../../../database/test/integration/harness";
import { getDocument } from "../../src/index";

test("workspace-scoped identifiers do not cross tenant boundaries", async () => {
	await withPostgres(async (db) => {
		await db.workspace.create({ data: { id: "scope_one", name: "One", slug: "scope-one" } });
		await db.workspace.create({ data: { id: "scope_two", name: "Two", slug: "scope-two" } });
		await db.document.create({
			data: { id: "private_doc", workspaceId: "scope_one", title: "Private", contentType: "text/plain", byteSize: 4 },
		});
		expect(await getDocument({ workspaceId: "scope_two", principalId: "user" }, "private_doc", db)).toBeNull();
	});
}, 30_000);
