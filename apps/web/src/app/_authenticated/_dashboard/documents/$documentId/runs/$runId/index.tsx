import { createFileRoute } from "@tanstack/react-router";
import { RunDetailView } from "../../../-components/run-detail-view";
export const Route = createFileRoute("/_authenticated/_dashboard/documents/$documentId/runs/$runId/")({ component: RunDetail });
function RunDetail() {
	const { runId } = Route.useParams();
	return <RunDetailView runId={runId} />;
}
