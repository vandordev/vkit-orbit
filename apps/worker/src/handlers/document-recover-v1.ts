import { recoverProcessing } from "@repo/application";
import { documentRecoverV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createDocumentRecoverHandler = (db: any) =>
	typedHandler(documentRecoverV1, async (payload) => {
		const run = await db.processingRun.findFirst({
			where: {
				workspaceId: payload.workspaceId,
				id: payload.runId,
				stageRevision: payload.revision,
				status: { notIn: ["COMPLETED", "CANCELED"] },
			},
		});
		if (!run) return "NO_OP";
		await recoverProcessing({ limit: 1, workspaceId: payload.workspaceId, runId: payload.runId }, db);
		return "SUCCESS";
	});
