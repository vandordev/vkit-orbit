import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GlobalError({ reset }: ErrorComponentProps) {
	return (
		<main className="flex min-h-[60vh] items-center justify-center px-6 py-20">
			<section className="max-w-lg space-y-6 text-center" role="alert">
				<AlertTriangle aria-hidden="true" className="mx-auto size-10 text-amber-400" />
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">Something went off course</h1>
					<p className="text-muted-foreground">The page could not complete that request. Try again or return to the starting point.</p>
				</div>
				<div className="flex flex-wrap justify-center gap-3">
					<Button type="button" onClick={() => reset()}>Try again</Button>
					<Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
				</div>
			</section>
		</main>
	);
}
