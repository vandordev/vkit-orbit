import { createFileRoute, Link } from "@tanstack/react-router";
import { documentSearchSchema } from "@/lib/document-search";
import { DocumentTable } from "./-components/document-table";
export const Route = createFileRoute("/_authenticated/app/documents/")({ validateSearch: documentSearchSchema, component: DocumentsPage });
function DocumentsPage() {
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">Workspace</p>
					<h1 className="mt-2 text-3xl font-semibold">Documents</h1>
					<p className="mt-2 text-muted-foreground">Search and process your source files.</p>
				</div>
				<Link
					to="/app/documents/new"
					className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
				>
					Upload document
				</Link>
			</header>
			<label className="block max-w-xl text-sm font-medium" htmlFor="document-search">
				Search documents
				<input
					id="document-search"
					name="q"
					type="search"
					placeholder="Search by filename"
					className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 focus-visible:ring-2"
				/>
			</label>
			<DocumentTable />
		</div>
	);
}
