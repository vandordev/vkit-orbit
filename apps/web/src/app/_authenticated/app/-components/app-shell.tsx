import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-background md:flex">
			<aside className="border-b border-border bg-white md:min-h-screen md:w-64 md:border-r md:border-b-0">
				<div className="flex items-center justify-between gap-4 p-4">
					<WorkspaceSwitcher />
					<UserMenu />
				</div>
				<nav aria-label="Workspace navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:grid md:content-start md:gap-1">
					{[
						["Overview", "/app/overview"],
						["Documents", "/app/documents"],
						["Activity", "/app/activity"],
						["Developers", "/app/developers/api-keys"],
						["Settings", "/app/settings/workspace"],
					].map(([label, to]) => (
						<Link
							key={to}
							to={to}
							activeProps={{ className: "bg-primary/10 text-primary" }}
							className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2"
						>
							{label}
						</Link>
					))}
				</nav>
			</aside>
			<main className="min-w-0 flex-1 p-5 md:p-8">
				<div className="mx-auto max-w-6xl">{children}</div>
			</main>
		</div>
	);
}
