import { Link } from "@tanstack/react-router";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@repo/components/table";
export function DocumentTable({ documents = [] }: { documents?: Array<{ id: string; name: string; status: string }> }) {
	if (!documents.length)
		return (
			<div className="rounded-xl border border-dashed border-border p-12 text-center">
				<h2 className="font-semibold">No documents yet</h2>
				<p className="mt-2 text-sm text-muted-foreground">Upload a plain text document to get started.</p>
			</div>
		);
	return (
		<div className="overflow-x-auto rounded-xl border border-border bg-white">
			<Table className="min-w-[560px]">
				<TableCaption className="sr-only">Documents</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Open</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{documents.map((doc) => (
						<TableRow key={doc.id}>
							<TableCell className="font-medium">{doc.name}</TableCell>
							<TableCell>{doc.status}</TableCell>
							<TableCell>
								<Link
									className="text-primary underline"
									to="/documents/$documentId"
									params={{ documentId: doc.id }}
									search={(previous) => ({ workspaceId: previous.workspaceId })}
								>
									View
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
