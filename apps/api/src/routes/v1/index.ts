import { createRoutes } from "../create-routes";
import { apiKeyPlugin } from "../../plugins/api-key";
import { idempotencyPlugin } from "../../plugins/idempotency";
import { createDocumentUploadHandler } from "../../handlers/v1/document-uploads/create";
import { confirmDocumentUploadHandler } from "../../handlers/v1/document-uploads/confirm";
import { submitProcessingRunHandler } from "../../handlers/v1/documents/submit";
import { listDocumentsHandler } from "../../handlers/v1/documents/list";
import { getDocumentHandler } from "../../handlers/v1/documents/detail";
import { cancelProcessingRunHandler } from "../../handlers/v1/processing-runs/cancel";
import { retryProcessingRunHandler } from "../../handlers/v1/processing-runs/retry";
import { getProcessingRunHandler } from "../../handlers/v1/processing-runs/detail";
import { getProcessingResultHandler } from "../../handlers/v1/processing-runs/result";
import { systemRoutes } from "./system";

export function createV1Routes() {
	return createRoutes(1)
		.use(apiKeyPlugin)
		.use(idempotencyPlugin)
		.use(createDocumentUploadHandler)
		.use(confirmDocumentUploadHandler)
		.use(submitProcessingRunHandler)
		.use(cancelProcessingRunHandler)
		.use(retryProcessingRunHandler)
		.use(listDocumentsHandler)
		.use(getDocumentHandler)
		.use(getProcessingRunHandler)
		.use(getProcessingResultHandler)
		.use(systemRoutes);
}
