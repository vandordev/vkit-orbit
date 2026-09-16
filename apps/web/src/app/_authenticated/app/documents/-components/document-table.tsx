import { Link } from "@tanstack/react-router";
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
			<table className="w-full min-w-[560px] text-left text-sm">
				<caption className="sr-only">Documents</caption>
				<thead className="border-b border-border text-muted-foreground">
					<tr>
						<th className="p-4">Name</th>
						<th className="p-4">Status</th>
						<th className="p-4">Open</th>
					</tr>
				</thead>
				<tbody>
					{documents.map((doc) => (
						<tr key={doc.id} className="border-b border-border last:border-0">
							<td className="p-4 font-medium">{doc.name}</td>
							<td className="p-4">{doc.status}</td>
							<td className="p-4">
								<Link className="text-primary underline" to="/app/documents/$documentId" params={{ documentId: doc.id }}>
									View
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
