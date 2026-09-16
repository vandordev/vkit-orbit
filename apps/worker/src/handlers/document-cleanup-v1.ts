import { cleanupDocuments } from "@repo/application";
import { documentCleanupV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createDocumentCleanupHandler = (db: any) =>
	typedHandler(documentCleanupV1, async (payload) => {
		const document = await db.document.findFirst({
			where: { workspaceId: payload.workspaceId, id: payload.documentId, status: "UPLOADING" },
		});
		if (!document) return "NO_OP";
		await cleanupDocuments({ before: new Date(), limit: 1 }, db);
		return "SUCCESS";
	});
