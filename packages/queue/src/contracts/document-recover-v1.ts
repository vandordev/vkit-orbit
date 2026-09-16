import { recoveryPayload, type JobContract } from "./types";
export const documentRecoverV1: JobContract<typeof recoveryPayload> = {
	name: "document.recover.v1",
	queue: "documents",
	schema: recoveryPayload,
};
