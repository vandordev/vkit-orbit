import { stagePayload, type JobContract } from "./types";
export const documentAnalyzeV1: JobContract<typeof stagePayload> = {
	name: "document.analyze.v1",
	queue: "documents",
	schema: stagePayload,
};
