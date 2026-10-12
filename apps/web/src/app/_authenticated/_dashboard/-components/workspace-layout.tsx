import { brand } from "@repo/brand";
import logoUrl from "@repo/brand/logo.png";
import { AppShell, type AppShellNavigationItem } from "@repo/components/app-shell";
import { Loading } from "@repo/components/loading";
import { Button } from "@repo/components/button";
import { Building2Icon, UserRoundIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ShellIdentity =
	{ status: "pending" } | { status: "error"; onRetry: () => void } | { status: "ready"; label: string } | { status: "unselected" };

function Identity({ identity, collapsed, kind }: { identity: ShellIdentity; collapsed: boolean; kind: "workspace" | "account" }) {
	const Icon = kind === "workspace" ? Building2Icon : UserRoundIcon;
	const fallback = kind === "workspace" ? "Workspace" : "Account";
	return (
		<div
			className="flex min-h-12 w-full min-w-0 items-center gap-3 px-2"
			aria-label={identity.status === "ready" ? `${fallback}: ${identity.label}` : fallback}
		>
			<span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
				<Icon className="size-4" />
			</span>
			{collapsed ? (
				<span className="sr-only">
					{identity.status === "ready"
						? identity.label
						: identity.status === "pending"
							? `Loading ${fallback.toLowerCase()}`
							: identity.status === "error"
								? `Could not load ${fallback.toLowerCase()}`
								: "No workspace selected"}
				</span>
			) : (
				<div className="min-w-0 flex-1 text-sm">
					{identity.status === "ready" && (
						<span className="block truncate font-medium" title={identity.label}>
							{identity.label}
						</span>
					)}
					{identity.status === "pending" && <Loading size={16} aria-label={`Loading ${fallback.toLowerCase()}`} />}
					{identity.status === "unselected" && <span className="text-muted-foreground">No workspace selected</span>}
					{identity.status === "error" && (
						<div className="flex flex-col gap-1">
							<span role="status" className="text-xs text-muted-foreground">
								Could not load {fallback.toLowerCase()}.
							</span>
							<Button variant="link" size="sm" className="h-auto justify-start p-0" onClick={identity.onRetry}>
								Retry
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export interface WorkspaceLayoutProps {
	navigation: readonly AppShellNavigationItem[];
	workspace: ShellIdentity;
	account: ShellIdentity;
	heading: string;
	children: ReactNode;
	defaultCollapsed?: boolean;
}

export function WorkspaceLayout({ navigation, workspace, account, heading, children, defaultCollapsed }: WorkspaceLayoutProps) {
	return (
		<AppShell
			navigation={navigation}
			defaultCollapsed={defaultCollapsed}
			header={heading}
			sidebarHeader={({ collapsed }) => <Identity kind="workspace" identity={workspace} collapsed={collapsed} />}
			sidebarFooter={({ collapsed }) => <Identity kind="account" identity={account} collapsed={collapsed} />}
			actions={
				<div role="img" aria-label={brand.name} translate="no" className="flex items-center gap-2">
					<span className="grid size-8 place-items-center rounded-md bg-foreground">
						<img src={logoUrl} width={24} height={24} alt="" />
					</span>
					<span aria-hidden="true" className="hidden text-sm font-semibold sm:inline">
						{brand.name}
					</span>
				</div>
			}
		>
			<div className="mx-auto w-full max-w-6xl">{children}</div>
		</AppShell>
	);
}
