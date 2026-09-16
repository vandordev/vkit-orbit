import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusTimeline } from "../-components/status-timeline";
export const Route = createFileRoute("/_authenticated/app/documents/$documentId/")({ component: DocumentDetail });
function DocumentDetail() {
	const { documentId } = Route.useParams();
	return (
		<div className="space-y-6">
			<Link to="/app/documents" className="text-sm text-primary underline">
				← All documents
			</Link>
			<header>
				<h1 className="mt-3 text-3xl font-semibold">Document {documentId}</h1>
				<p className="mt-2 text-muted-foreground">Processing history and results.</p>
			</header>
			<section className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-xl border border-border bg-white p-6">
					<h2 className="font-semibold">Latest run</h2>
					<div className="mt-5">
						<StatusTimeline />
					</div>
				</div>
				<div className="rounded-xl border border-border bg-white p-6">
					<h2 className="font-semibold">Result</h2>
					<p className="mt-3 text-sm text-muted-foreground">Your completed report will appear here.</p>
				</div>
			</section>
		</div>
	);
}
