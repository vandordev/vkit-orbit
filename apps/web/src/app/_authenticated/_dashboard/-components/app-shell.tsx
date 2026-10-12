import { Link, useLocation, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityIcon, FileTextIcon, KeyRoundIcon, LayoutDashboardIcon, SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";
import { RealtimeBridge } from "./realtime-bridge";
import { WorkspaceLayout, type ShellIdentity } from "./workspace-layout";
import { trpc } from "@/trpc/client";

export function AppShell({ children }: { children: ReactNode }) {
	const pathname = useLocation({ select: (location) => location.pathname });
	const { workspaceId } = useSearch({ from: "/_authenticated" });
	const accountQuery = useQuery({ queryKey: ["account", "me"], queryFn: () => trpc.auth.me.query() });
	const workspaceQuery = useQuery({
		queryKey: ["workspace", workspaceId, "current"],
		queryFn: () => (workspaceId ? trpc.workspace.current.query({ workspaceId }) : Promise.resolve(null)),
		enabled: Boolean(workspaceId),
	});
	const destinations = [
		{ id: "overview", label: "Overview", to: "/", icon: <LayoutDashboardIcon /> },
		{ id: "documents", label: "Documents", to: "/documents", icon: <FileTextIcon /> },
		{ id: "activity", label: "Activity", to: "/activity", icon: <ActivityIcon /> },
		{ id: "developers", label: "Developers", to: "/developers/api-keys", icon: <KeyRoundIcon /> },
		{ id: "settings", label: "Settings", to: "/settings/workspace", icon: <SettingsIcon /> },
	] as const;
	const navigation = destinations.map((item) => ({
		...item,
		active:
			item.id === "overview" ? pathname === "/" : pathname === item.to || pathname.startsWith(`/${item.id}/`) || pathname === `/${item.id}`,
		link: <Link to={item.to} search={{ workspaceId }} />,
	}));
	const workspace: ShellIdentity = !workspaceId
		? { status: "unselected" }
		: workspaceQuery.isError
			? {
					status: "error",
					onRetry: () => {
						void workspaceQuery.refetch();
					},
				}
			: workspaceQuery.data
				? { status: "ready", label: workspaceQuery.data.name }
				: { status: "pending" };
	const account: ShellIdentity = accountQuery.isError
		? {
				status: "error",
				onRetry: () => {
					void accountQuery.refetch();
				},
			}
		: accountQuery.data
			? { status: "ready", label: accountQuery.data.user.email }
			: { status: "pending" };
	return (
		<>
			<RealtimeBridge />
			<WorkspaceLayout
				navigation={navigation}
				workspace={workspace}
				account={account}
				heading={navigation.find((item) => item.active)?.label ?? "Workspace"}
			>
				{children}
			</WorkspaceLayout>
		</>
	);
}
