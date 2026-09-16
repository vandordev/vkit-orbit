export function WorkspaceSwitcher() {
	return (
		<button
			type="button"
			aria-label="Switch workspace"
			className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left font-semibold focus-visible:ring-2"
		>
			<span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">O</span>
			<span className="truncate">Orbit workspace</span>
			<span aria-hidden="true">⌄</span>
		</button>
	);
}
