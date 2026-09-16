import { createFileRoute } from "@tanstack/react-router";
import { UploadWorkflow } from "../-components/upload-workflow";
export const Route = createFileRoute("/_authenticated/app/documents/new/")({
	component: () => (
		<div className="mx-auto max-w-2xl space-y-6">
			<h1 className="text-3xl font-semibold">New document</h1>
			<UploadWorkflow />
		</div>
	),
});
