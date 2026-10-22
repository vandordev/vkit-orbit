import { Link } from "@tanstack/react-router";
import { DocumentTable } from "./document-table";
import { Input } from "@repo/components/input";
export function DocumentsPage() {
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-primary">Workspace</p>
					<h1 className="mt-2 text-3xl font-semibold">Documents</h1>
					<p className="mt-2 text-muted-foreground">Search and process your source files.</p>
				</div>
				<Link
					to="/documents/new"
					search={(previous) => ({ workspaceId: previous.workspaceId })}
					className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
				>
					Upload document
				</Link>
			</header>
			<Input
				label="Search documents"
				containerClassName="max-w-xl"
				id="document-search"
				name="q"
				type="search"
				placeholder="Search by filename"
			/>
			<DocumentTable />
		</div>
	);
}
