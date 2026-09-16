import { useState } from "react";
export function UploadWorkflow() {
	const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
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
					onClick={() => setStage("analyzing")}
					className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
				>
					Confirm upload
				</button>
			)}
		</section>
	);
}
