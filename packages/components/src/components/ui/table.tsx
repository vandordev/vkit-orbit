import { cn } from "cn";
import type { ComponentProps } from "react";

/** Semantic table primitives; consumers own data, links and overflow containers. */
export function Table({ className, ...props }: ComponentProps<"table">) {
	return <table data-slot="table" className={cn("w-full text-left text-sm", className)} {...props} />;
}
export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
	return <caption data-slot="table-caption" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
	return <thead data-slot="table-header" className={cn("border-b border-border text-muted-foreground", className)} {...props} />;
}
export function TableBody(props: ComponentProps<"tbody">) {
	return <tbody data-slot="table-body" {...props} />;
}
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
	return <tfoot data-slot="table-footer" className={cn("border-t border-border font-medium", className)} {...props} />;
}
export function TableRow({ className, ...props }: ComponentProps<"tr">) {
	return <tr data-slot="table-row" className={cn("border-b border-border last:border-0", className)} {...props} />;
}
export function TableHead({ className, scope = "col", ...props }: ComponentProps<"th">) {
	return <th data-slot="table-head" scope={scope} className={cn("p-4", className)} {...props} />;
}
export function TableCell({ className, ...props }: ComponentProps<"td">) {
	return <td data-slot="table-cell" className={cn("p-4", className)} {...props} />;
}
