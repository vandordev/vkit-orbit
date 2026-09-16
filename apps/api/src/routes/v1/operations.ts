export const publicOperations = [
	"POST /v1/document-uploads",
	"POST /v1/documents/:documentId/upload-confirmations",
	"POST /v1/documents/:documentId/processing-runs",
	"POST /v1/processing-runs/:runId/cancellations",
	"POST /v1/processing-runs/:runId/retries",
	"GET /v1/documents",
	"GET /v1/documents/:documentId",
	"GET /v1/processing-runs/:runId",
	"GET /v1/processing-runs/:runId/result",
] as const;
