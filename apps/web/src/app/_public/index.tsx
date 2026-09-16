import { createFileRoute } from "@tanstack/react-router";

import { appConfig } from "@/lib/config";
import { createMetadata } from "@/lib/metadata";
import { HeroText } from "@/components/ui/hero-shutter-text";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
	head: () => createMetadata({ title: appConfig.appName, description: appConfig.defaultDescription, pathname: "/" }),
	component: LandingPage,
});

function LandingPage() {
	return (
		<main className="h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950">
			<div className="relative flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
				<HeroText />
				<p className="max-w-md text-zinc-600">A calm workspace for uploading, processing, and understanding your documents.</p>
				<div className="flex flex-wrap justify-center gap-3">
					<Link
						to="/sign-in"
						className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:ring-2"
					>
						Sign in
					</Link>
					<Link to="/register" className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-semibold focus-visible:ring-2">
						Create account
					</Link>
				</div>
			</div>
		</main>
	);
}
