import { useState } from "react";
export function UploadWorkflow() {
	const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
	const [report, setReport] = useState<{ title: string; headings: string[]; words: number; lines: number; sha256: string; json: string }>();
	async function confirm() {
		const input = document.querySelector<HTMLInputElement>('input[type="file"]');
		const text = await input?.files?.[0]?.text();
		if (!text) return setStage("analyzing");
		const lines = text.split(/\r?\n/);
		const title =
			lines
				.find((line) => line.startsWith("# "))
				?.slice(2)
				.trim() ?? "Untitled";
		const headings = lines.filter((line) => /^#{1,6} /.test(line)).map((line) => line.replace(/^#+ /, "").trim());
		const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
		const sha256 = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
		const value = { title, headings, wordCount: text.trim().split(/\s+/).filter(Boolean).length, lineCount: lines.length, sha256 };
		setReport({ title, headings, words: value.wordCount, lines: value.lineCount, sha256, json: JSON.stringify(value) });
		setStage("analyzing");
	}
	return (
		<section className="rounded-xl border border-border bg-white p-6">
			<h2 className="text-lg font-semibold">Upload a document</h2>
			<p className="mt-1 text-sm text-muted-foreground">Only .txt and .md files are supported.</p>
			<input
				aria-label="Choose a .txt or .md document"
				type="file"
				accept=".txt,.md,text/plain,text/markdown"
				onChange={() => setStage("uploading")}
				className="mt-5 block w-full text-sm"
			/>
			{stage === "uploading" && (
				<p className="mt-4 text-sm font-medium text-primary" aria-live="polite">
					Uploading document
				</p>
			)}
			{stage === "analyzing" && (
				<p className="mt-4 text-sm font-medium text-primary" aria-live="polite">
					Analyzing document
				</p>
			)}
			{stage === "uploading" && (
				<button
					type="button"
					onClick={() => void confirm()}
					className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
				>
					Confirm upload
				</button>
			)}
			{report && (
				<section aria-label="Processing report" className="mt-5 space-y-2">
					<h3>{report.title}</h3>
					<p>{report.headings.join(" · ")}</p>
					<p data-word-count>{report.words} words</p>
					<p data-line-count>{report.lines} lines</p>
					<p data-sha256>{report.sha256}</p>
					<a download="result.json" href={`data:application/json,${encodeURIComponent(report.json)}`}>
						Download result JSON
					</a>
				</section>
			)}
		</section>
	);
}
