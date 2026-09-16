import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/app/settings/members/")({ component: MembersPage });
function MembersPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-semibold">Members</h1>
			<section className="rounded-xl border border-dashed border-border p-10 text-center">
				<h2 className="font-semibold">Members</h2>
				<p className="mt-2 text-sm text-muted-foreground">Invite teammates and manage workspace permissions.</p>
			</section>
		</div>
	);
}
