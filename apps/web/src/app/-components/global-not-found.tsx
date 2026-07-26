import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function GlobalNotFound() {
	return (
		<main className="flex min-h-[60vh] items-center justify-center px-6 py-20">
			<section className="max-w-lg space-y-6 text-center">
				<h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
				<p className="text-muted-foreground">That route is not part of this workspace.</p>
				<Button asChild>
					<Link to="/">Back to home</Link>
				</Button>
			</section>
		</main>
	);
}
