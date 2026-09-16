import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/activity/")({ component: ActivityPage });
function ActivityPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Activity</h1>
			<section className="rounded-xl border border-dashed border-border p-10 text-center">
				<h2 className="font-semibold">No activity yet</h2>
				<p className="mt-2 text-sm text-muted-foreground">Workspace audit events will appear here.</p>
			</section>
		</div>
	);
}
