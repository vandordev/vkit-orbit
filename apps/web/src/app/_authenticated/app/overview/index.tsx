import { createFileRoute } from "@tanstack/react-router";
import { createMetadata } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/app/overview/")({
	head: () => createMetadata({ title: "Overview", description: "Workspace overview." }),
	component: Overview,
});
function Overview() {
	return (
		<div className="space-y-8">
			<header>
				<p className="text-sm font-medium text-primary">Workspace overview</p>
				<h1 className="mt-2 text-3xl font-semibold tracking-tight">Good morning, welcome back.</h1>
				<p className="mt-2 text-muted-foreground">Keep an eye on your documents and processing runs.</p>
			</header>
			<section className="grid gap-4 sm:grid-cols-3" aria-label="Workspace status">
				<div className="rounded-xl border border-border bg-white p-5">
					<p className="text-sm text-muted-foreground">Documents</p>
					<p className="mt-2 text-3xl font-semibold">0</p>
				</div>
				<div className="rounded-xl border border-border bg-white p-5">
					<p className="text-sm text-muted-foreground">Processing</p>
					<p className="mt-2 text-3xl font-semibold">0</p>
				</div>
				<div className="rounded-xl border border-border bg-white p-5">
					<p className="text-sm text-muted-foreground">Completed runs</p>
					<p className="mt-2 text-3xl font-semibold">0</p>
				</div>
			</section>
			<section className="rounded-xl border border-dashed border-border p-10 text-center">
				<h2 className="font-semibold">Your workspace is ready</h2>
				<p className="mt-2 text-sm text-muted-foreground">Upload a .txt or .md document to begin.</p>
			</section>
		</div>
	);
}
