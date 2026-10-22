import { cn } from "cn";
import { useId, type ComponentProps } from "react";

export type InputProps = Omit<ComponentProps<"input">, "children"> & {
	label?: string;
	containerClassName?: string;
};

/** Static-label subset of Vandor Input, including native file and form semantics. */
export function Input({ label, containerClassName, className, id, ...props }: InputProps) {
	const generatedId = useId();
	const inputId = id ?? (label ? generatedId : undefined);
	const input = (
		<input
			{...props}
			id={inputId}
			data-slot="input"
			className={cn(
				"h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive file:mr-3 file:border-0 file:bg-transparent file:font-medium",
				className,
			)}
		/>
	);
	if (!label && !containerClassName) return input;
	return (
		<div data-slot="input-field" className={cn("grid min-w-0 gap-2", containerClassName)}>
			{label && (
				<label htmlFor={inputId} className="text-sm font-medium">
					{label}
				</label>
			)}
			{input}
		</div>
	);
}
