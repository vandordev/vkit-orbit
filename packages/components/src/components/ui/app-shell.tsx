"use client";

// Adapted from Universe's shared AppShell, originally based on @7ovr/app-shell-3.
// Consumer slots own links, product identity, workspace/account data and actions.
import { cn } from "cn";
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { cloneElement, useEffect, useId, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "./button";
import { Drawer, DrawerBody } from "./drawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface AppShellNavigationItem {
	id: string;
	label: string;
	icon: ReactNode;
	active?: boolean;
	disabled?: boolean;
	/** Supply a real link (including a router Link), not an onClick navigation action. */
	link: ReactElement<{ children?: ReactNode }>;
}

export interface AppShellProps {
	navigation: readonly AppShellNavigationItem[];
	children: ReactNode;
	header?: ReactNode;
	actions?: ReactNode;
	sidebarHeader: (state: { collapsed: boolean }) => ReactNode;
	sidebarFooter?: (state: { collapsed: boolean }) => ReactNode;
	defaultCollapsed?: boolean;
	collapsed?: boolean;
	onCollapsedChange?: (collapsed: boolean) => void;
	navigationLabel?: string;
	contentClassName?: string;
}

export function AppShell({
	navigation,
	children,
	header,
	actions,
	sidebarHeader,
	sidebarFooter,
	defaultCollapsed = false,
	collapsed: controlledCollapsed,
	onCollapsedChange,
	navigationLabel = "Workspace navigation",
	contentClassName,
}: AppShellProps) {
	const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
	const [mobileOpen, setMobileOpen] = useState(false);
	const collapsed = controlledCollapsed ?? internalCollapsed;
	const contentId = useId();
	const sidebarId = useId();
	useEffect(() => {
		const media = window.matchMedia("(min-width: 768px)");
		const closeOnDesktop = () => {
			if (media.matches) setMobileOpen(false);
		};
		media.addEventListener("change", closeOnDesktop);
		return () => media.removeEventListener("change", closeOnDesktop);
	}, []);
	const renderNavigation = (compact: boolean, mobile = false) => (
		<nav aria-label={navigationLabel} className="flex flex-col gap-1 p-2">
			{navigation.map((item) => {
				const controlProps = {
					"aria-label": item.label,
					"aria-current": item.active ? ("page" as const) : undefined,
					className: cn("h-11 w-full justify-start gap-3 overflow-hidden px-3", item.active && "bg-accent text-accent-foreground"),
				};
				const content = (
					<>
						<span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
							{item.icon}
						</span>
						<span aria-hidden={compact || undefined} className={cn("min-w-0 truncate", compact && "hidden")}>
							{item.label}
						</span>
					</>
				);
				const control = item.disabled ? (
					<Button variant="ghost" disabled {...controlProps}>
						{content}
					</Button>
				) : (
					<Button
						variant="ghost"
						asChild
						onClick={() => {
							if (mobile) setMobileOpen(false);
						}}
						{...controlProps}
					>
						{cloneElement(item.link, {}, content)}
					</Button>
				);
				return (
					<Tooltip key={item.id} disabled={!compact || mobile}>
						<TooltipTrigger render={control} />
						<TooltipContent>{item.label}</TooltipContent>
					</Tooltip>
				);
			})}
		</nav>
	);
	const footer = (compact: boolean) =>
		sidebarFooter && <div className="mt-auto shrink-0 border-t border-border p-2">{sidebarFooter({ collapsed: compact })}</div>;
	return (
		<TooltipProvider>
			<div data-slot="app-shell" data-collapsed={collapsed} className="flex min-h-svh bg-muted/30 text-foreground">
				<a
					href={`#${contentId}`}
					className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
				>
					Skip to content
				</a>
				<aside
					id={sidebarId}
					aria-label="Sidebar"
					className={cn(
						"sticky top-0 hidden h-svh shrink-0 flex-col overflow-hidden border-r border-border bg-background md:flex",
						collapsed ? "w-16" : "w-60",
					)}
				>
					<div className="flex h-16 shrink-0 items-center border-b border-border p-2">{sidebarHeader({ collapsed })}</div>
					<div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{renderNavigation(collapsed)}</div>
					{footer(collapsed)}
				</aside>
				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
						<Drawer
							title={navigationLabel}
							open={mobileOpen}
							onOpenChange={setMobileOpen}
							trigger={
								<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
									<MenuIcon aria-hidden="true" />
								</Button>
							}
						>
							<DrawerBody className="flex flex-col">
								<div className="shrink-0 border-b border-border p-2">{sidebarHeader({ collapsed: false })}</div>
								<div className="min-h-0 flex-1 overflow-y-auto">{renderNavigation(false, true)}</div>
								{footer(false)}
							</DrawerBody>
						</Drawer>
						<Button
							variant="ghost"
							size="icon"
							className="hidden md:inline-flex"
							aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
							aria-expanded={!collapsed}
							aria-controls={sidebarId}
							onClick={() => {
								if (controlledCollapsed === undefined) setInternalCollapsed(!collapsed);
								onCollapsedChange?.(!collapsed);
							}}
						>
							{collapsed ? <PanelLeftOpenIcon aria-hidden="true" /> : <PanelLeftCloseIcon aria-hidden="true" />}
						</Button>
						<div className="min-w-0 flex-1 truncate text-sm font-medium">{header}</div>
						{actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
					</header>
					<main
						id={contentId}
						tabIndex={-1}
						className={cn("min-w-0 flex-1 scroll-mt-20 p-4 focus-visible:outline-2 sm:p-6", contentClassName)}
					>
						{children}
					</main>
				</div>
			</div>
		</TooltipProvider>
	);
}
