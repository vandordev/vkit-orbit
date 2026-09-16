import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/settings/workspace/")({ component: WorkspaceSettings });
function WorkspaceSettings() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Workspace settings</h1>
			<section className="rounded-xl border border-border bg-white p-6">
				<label className="grid gap-2 text-sm font-medium" htmlFor="workspace-name">
					Workspace name
					<input
						id="workspace-name"
						defaultValue="Orbit workspace"
						className="h-11 rounded-md border border-border px-3 focus-visible:ring-2"
					/>
				</label>
				<button
					type="button"
					className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
				>
					Save changes
				</button>
			</section>
		</div>
	);
}
