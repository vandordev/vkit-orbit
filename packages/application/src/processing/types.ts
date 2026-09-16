import { createHash } from "node:crypto";

export type Stage = "VALIDATING" | "ANALYZING" | "FINALIZING";
export type StageOutcome = "SUCCESS" | "NO_OP" | "RETRYABLE" | "TERMINAL" | "UNKNOWN";

export type DocumentReport = {
	bytes: number;
	lines: number;
	words: number;
	headings: string[];
	title: string;
	readingTimeMinutes: number;
	sha256: string;
};

export function buildDocumentReport(content: string): DocumentReport {
	const lines = content.split(/\r?\n/);
	const headings = lines.filter((line) => /^#{1,6}\s+/.test(line)).map((line) => line.replace(/^#{1,6}\s+/, "").trim());
	const firstHeading = headings[0];
	const title = (firstHeading || lines.find((line) => line.trim()) || "Untitled").trim().slice(0, 200);
	const words = content.trim() ? content.trim().split(/\s+/).length : 0;
	return {
		bytes: Buffer.byteLength(content),
		lines: lines.length,
		words,
		headings,
		title,
		readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
		sha256: createHash("sha256").update(content).digest("hex"),
	};
}
