import { claimStage, completeFinalization, failStage } from "@repo/application";
import { documentFinalizeV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createDocumentFinalizeHandler = (
	db: any,
	makeArtifact: (
		runId: string,
	) => Promise<{ id: string; documentId: string; objectKey: string; contentType: string; byteSize: number; checksum?: string }>,
) =>
	typedHandler(documentFinalizeV1, async (payload) => {
		const claimed = await claimStage({ ...payload, stage: "FINALIZING" }, db);
		if (!claimed) return "NO_OP";
		try {
			await completeFinalization({ ...payload, artifact: await makeArtifact(payload.runId) }, db);
			return "SUCCESS";
		} catch (error) {
			await failStage({ ...payload, errorCode: error instanceof Error ? error.name : "FINALIZATION_FAILED" }, db);
			return "RETRYABLE";
		}
	});
