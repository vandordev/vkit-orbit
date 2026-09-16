import { createFileRoute } from "@tanstack/react-router";
import { StatusTimeline } from "../../../-components/status-timeline";
export const Route = createFileRoute("/_authenticated/app/documents/$documentId/runs/$runId/")({ component: RunDetail });
function RunDetail() {
	const { runId } = Route.useParams();
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Processing run {runId}</h1>
			<section className="rounded-xl border border-border bg-white p-6">
				<StatusTimeline status="FAILED" />
				<button type="button" className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-semibold focus-visible:ring-2">
					Cancel run
				</button>
			</section>
		</div>
	);
}
