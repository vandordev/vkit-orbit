"use client";

import { Tooltip as Primitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

export const TooltipProvider = Primitive.Provider;
export const Tooltip = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;

export function TooltipContent({
	children,
	className,
	side = "right",
}: {
	children: React.ReactNode;
	className?: string;
	side?: Primitive.Positioner.Props["side"];
}) {
	return (
		<Primitive.Portal>
			<Primitive.Positioner side={side} sideOffset={8} className="z-50">
				<Primitive.Popup
					data-slot="tooltip-content"
					className={cn("max-w-64 rounded-md bg-foreground px-3 py-2 text-xs text-background", className)}
				>
					{children}
				</Primitive.Popup>
			</Primitive.Positioner>
		</Primitive.Portal>
	);
}
