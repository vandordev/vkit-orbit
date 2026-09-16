import { stagePayload, type JobContract } from "./types";
export const documentValidateV1: JobContract<typeof stagePayload> = {
	name: "document.validate.v1",
	queue: "documents",
	schema: stagePayload,
};
