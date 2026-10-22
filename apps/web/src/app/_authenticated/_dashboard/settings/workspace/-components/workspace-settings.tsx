import { Button } from "@repo/components/button";
import { Input } from "@repo/components/input";
export function WorkspaceSettings() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Workspace settings</h1>
			<section className="rounded-xl border border-border bg-white p-6">
				<Input label="Workspace name" id="workspace-name" defaultValue="Orbit workspace" />
				<Button type="button" className="mt-5">
					Save changes
				</Button>
			</section>
		</div>
	);
}
