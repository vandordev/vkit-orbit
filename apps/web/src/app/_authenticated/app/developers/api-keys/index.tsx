import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/developers/api-keys/")({ component: ApiKeysPage });
function ApiKeysPage() {
	return (
		<div className="space-y-6">
			<header>
				<p className="text-sm font-medium text-primary">Developers</p>
				<h1 className="mt-2 text-3xl font-semibold">API keys</h1>
				<p className="mt-2 text-muted-foreground">Create scoped keys for automation. The secret is shown once.</p>
			</header>
			<section className="rounded-xl border border-border bg-white p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="font-semibold">No API keys</h2>
						<p className="mt-1 text-sm text-muted-foreground">New secrets will be shown once and never recovered.</p>
					</div>
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
					>
						Create API key
					</button>
				</div>
				<div className="mt-6 hidden" role="status">
					Secret shown once. Copy it now.
				</div>
				<div className="mt-6 flex gap-3">
					<button type="button" className="text-sm font-medium text-primary underline focus-visible:ring-2">
						Rotate
					</button>
					<button type="button" className="text-sm font-medium text-red-700 underline focus-visible:ring-2">
						Revoke
					</button>
				</div>
			</section>
		</div>
	);
}
