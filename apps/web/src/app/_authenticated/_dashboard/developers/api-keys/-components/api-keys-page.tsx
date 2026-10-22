import { Button } from "@repo/components/button";
export function ApiKeysPage() {
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
					<Button type="button">Create API key</Button>
				</div>
				<div className="mt-6 hidden" role="status">
					Secret shown once. Copy it now.
				</div>
				<div className="mt-6 flex gap-3">
					<Button type="button" variant="link" size="sm">
						Rotate
					</Button>
					<Button type="button" variant="destructive" size="sm">
						Revoke
					</Button>
				</div>
			</section>
		</div>
	);
}
