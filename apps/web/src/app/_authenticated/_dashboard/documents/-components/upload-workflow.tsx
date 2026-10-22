import { useState } from "react";
import { trpc } from "../../../../../trpc/client";
import { UploadWorkflowView, type UploadReport } from "./upload-workflow-view";
const documentApi = trpc;
export function UploadWorkflow() {
	const workspaceId =
		typeof window === "undefined" ? undefined : (new URLSearchParams(window.location.search).get("workspaceId") ?? undefined);
	const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
	const [report, setReport] = useState<UploadReport>();
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
			documentId: created.document.id,
			artifactId: created.artifact.id,
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
	return <UploadWorkflowView stage={stage} report={report} onFileChange={() => setStage("uploading")} onConfirm={() => void confirm()} />;
}
