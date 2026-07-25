import { SymmetricWave } from "@/components/ui/symmetric-wave";

export function GlobalPending() {
	return (
		<main className="flex min-h-[60vh] items-center justify-center px-6 py-20" aria-live="polite">
			<div className="flex items-center gap-3 text-muted-foreground">
				<SymmetricWave aria-label="Loading" />
				<span>Loading</span>
			</div>
		</main>
	);
}
