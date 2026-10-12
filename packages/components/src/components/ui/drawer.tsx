"use client";

// Scoped left-navigation adaptation of Vandor Drawer and Universe's AppShell.
// Source: @vandor/drawer. Imperative handles, snap points and nested stacks are
// intentionally outside this component's contract.
import { Drawer as Primitive } from "@base-ui/react/drawer";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Button } from "./button";

export interface DrawerProps {
	title: ReactNode;
	trigger: ReactElement;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}

export function Drawer({ title, trigger, open, onOpenChange, children }: DrawerProps) {
	return (
		<Primitive.Root open={open} onOpenChange={onOpenChange} swipeDirection="left">
			<Primitive.Trigger render={trigger} />
			<Primitive.Portal>
				<Primitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none" />
				<Primitive.Viewport className="fixed inset-0 z-50">
					<Primitive.Popup className="fixed inset-y-0 left-0 flex w-72 max-w-[calc(100vw-3rem)] flex-col border-r border-border bg-background text-foreground shadow-xl [transform:translateX(var(--drawer-swipe-movement-x,0px))] transition-transform duration-200 ease-out data-starting-style:-translate-x-full data-ending-style:-translate-x-full data-swiping:duration-0 motion-reduce:transition-none">
						<Primitive.Content className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
							<div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
								<Primitive.Title className="min-w-0 truncate text-sm font-semibold">{title}</Primitive.Title>
								<Primitive.Close render={<Button variant="ghost" size="icon" aria-label="Close navigation" />}>
									<XIcon aria-hidden="true" />
								</Primitive.Close>
							</div>
							{children}
						</Primitive.Content>
					</Primitive.Popup>
				</Primitive.Viewport>
			</Primitive.Portal>
		</Primitive.Root>
	);
}

export function DrawerBody({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)} {...props} />;
}
