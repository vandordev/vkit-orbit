import { Button } from "@repo/components/button";

export function StatusTimeline({ status = "QUEUED" }: { status?: string }) {
	const steps = ["Uploaded", "Validated", "Analyzed", "Completed"];
	return (
		<ol aria-label="Processing milestones" className="space-y-4">
			{steps.map((step, index) => (
				<li key={step} className="flex items-center gap-3">
					<span className="grid size-7 place-items-center rounded-full bg-muted text-xs">{index + 1}</span>
					<span>{step}</span>
					{status === "FAILED" && index === 2 && (
						<Button type="button" variant="link" size="sm" className="ml-auto">
							Retry
						</Button>
					)}
				</li>
			))}
		</ol>
	);
}
