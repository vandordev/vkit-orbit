import { stagePayload, type JobContract } from "./types";
export const documentFinalizeV1: JobContract<typeof stagePayload> = {
	name: "document.finalize.v1",
	queue: "documents",
	schema: stagePayload,
};
