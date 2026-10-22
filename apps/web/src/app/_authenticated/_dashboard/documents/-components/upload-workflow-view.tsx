import { Button } from "@repo/components/button";
import { Input } from "@repo/components/input";

export type UploadReport = { title: string; headings: string[]; words: number; lines: number; sha256: string; json: string };
export function UploadWorkflowView({
	stage,
	report,
	onFileChange,
	onConfirm,
}: {
	stage: "idle" | "uploading" | "analyzing";
	report?: UploadReport;
	onFileChange: () => void;
	onConfirm: () => void;
}) {
	return (
		<section className="rounded-xl border border-border bg-white p-6">
			<h2 className="text-lg font-semibold">Upload a document</h2>
			<p className="mt-1 text-sm text-muted-foreground">Only .txt and .md files are supported.</p>
			<Input
				aria-label="Choose a .txt or .md document"
				type="file"
				accept=".txt,.md,text/plain,text/markdown"
				onChange={onFileChange}
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
				<Button type="button" onClick={onConfirm} className="mt-4">
					Confirm upload
				</Button>
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
