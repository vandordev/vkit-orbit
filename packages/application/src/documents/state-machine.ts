export type DocumentStatus = "UPLOADING" | "READY";
export type ProcessingStatus = "QUEUED" | "VALIDATING" | "ANALYZING" | "FINALIZING" | "COMPLETED" | "FAILED" | "CANCELED";

const transitions: Record<string, string[]> = {
	UPLOADING: ["READY"],
	READY: ["QUEUED"],
	QUEUED: ["VALIDATING", "CANCELED"],
	VALIDATING: ["ANALYZING", "FAILED", "CANCELED"],
	ANALYZING: ["FINALIZING", "FAILED", "CANCELED"],
	FINALIZING: ["COMPLETED", "FAILED", "CANCELED"],
	FAILED: [],
	COMPLETED: [],
	CANCELED: [],
};

export function assertTransition(from: string, to: string, expectedRevision?: number, actualRevision?: number): void {
	if (expectedRevision !== undefined && actualRevision !== undefined && expectedRevision !== actualRevision)
		throw new Error("stale revision");
	if (!transitions[from]?.includes(to)) throw new Error(`invalid transition: ${from} -> ${to}`);
}

export function assertSupportedUpload(contentType: string, byteSize: number): void {
	if (!["text/plain", "text/markdown"].includes(contentType)) throw new Error("unsupported content type");
	if (!Number.isInteger(byteSize) || byteSize < 0 || byteSize > 10 * 1024 * 1024) throw new Error("upload is oversized");
}
