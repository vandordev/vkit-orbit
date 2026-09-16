import { buildDocumentReport, claimStage, completeAnalysis, failStage } from "@repo/application";
import { documentAnalyzeV1 } from "@repo/queue";
import { typedHandler } from "./types";
export const createDocumentAnalyzeHandler = (db: any, readContent: (runId: string) => Promise<string>) =>
	typedHandler(documentAnalyzeV1, async (payload) => {
		const claimed = await claimStage({ ...payload, stage: "ANALYZING" }, db);
		if (!claimed) return "NO_OP";
		try {
			const report = buildDocumentReport(await readContent(payload.runId));
			await completeAnalysis({ ...payload, report }, db);
			return "SUCCESS";
		} catch (error) {
			await failStage({ ...payload, errorCode: error instanceof Error ? error.name : "ANALYSIS_FAILED" }, db);
			return "RETRYABLE";
		}
	});
