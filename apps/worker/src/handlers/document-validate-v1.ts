import { claimStage, completeValidation, failStage } from "@repo/application";
import { documentValidateV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createDocumentValidateHandler = (db: any) =>
	typedHandler(documentValidateV1, async (payload) => {
		const claimed = await claimStage({ ...payload, stage: "VALIDATING" }, db);
		if (!claimed) return "NO_OP";
		try {
			await completeValidation(payload, db);
			return "SUCCESS";
		} catch (error) {
			await failStage({ ...payload, errorCode: error instanceof Error ? error.name : "VALIDATION_FAILED" }, db);
			return "RETRYABLE";
		}
	});
