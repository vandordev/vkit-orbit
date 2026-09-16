import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
const documentApi = trpc as any;
export function UploadWorkflow() {
	const workspaceId =
		typeof window === "undefined" ? undefined : (new URLSearchParams(window.location.search).get("workspaceId") ?? undefined);
	const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
	const [report, setReport] = useState<{ title: string; headings: string[]; words: number; lines: number; sha256: string; json: string }>();
	async function confirm() {
		const input = document.querySelector<HTMLInputElement>('input[type="file"]');
		const file = input?.files?.[0];
		if (!file || !workspaceId) return;
		const created = await documentApi.documents.createUpload.mutate({
			workspaceId,
			title: file.name,
			contentType: file.type === "text/markdown" ? "text/markdown" : "text/plain",
			byteSize: file.size,
		});
		const content = btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())));
		await documentApi.documents.uploadSource.mutate({
			workspaceId,
			objectKey: created.artifact.objectKey,
			contentType: file.type,
			content,
		});
		await documentApi.documents.confirmUpload.mutate({ workspaceId, documentId: created.document.id });
		const run = await documentApi.documents.submit.mutate({
			workspaceId,
			documentId: created.document.id,
			idempotencyKey: `e2e-${created.document.id}`,
		});
		setStage("analyzing");
		for (let attempt = 0; attempt < 30; attempt++) {
			const current = await documentApi.processingRuns.detail.query({ workspaceId, runId: run.id });
			if (current?.status === "COMPLETED" && current.result) {
				const value = current.result as { title: string; headings: string[]; wordCount: number; lineCount: number; sha256: string };
				setReport({
					title: value.title,
					headings: value.headings,
					words: value.wordCount,
					lines: value.lineCount,
					sha256: value.sha256,
					json: JSON.stringify(value),
				});
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
		throw new Error("processing timeout");
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
