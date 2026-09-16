import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/developers/webhooks/")({ component: WebhooksPage });
function WebhooksPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Webhooks</h1>
			<section className="rounded-xl border border-dashed border-border p-10 text-center">
				<h2 className="font-semibold">No webhook endpoints</h2>
				<p className="mt-2 text-sm text-muted-foreground">Delivery history and retry outcomes will appear here.</p>
			</section>
		</div>
	);
}
