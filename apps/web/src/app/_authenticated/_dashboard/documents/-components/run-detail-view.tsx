import { Button } from "@repo/components/button";
import { StatusTimeline } from "./status-timeline";
export function RunDetailView({ runId }: { runId: string }) {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Processing run {runId}</h1>
			<section className="rounded-xl border border-border bg-white p-6">
				<StatusTimeline status="FAILED" />
				<Button type="button" variant="outline" className="mt-6">
					Cancel run
				</Button>
			</section>
		</div>
	);
}
