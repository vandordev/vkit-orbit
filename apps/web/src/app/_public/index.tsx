import { createFileRoute } from "@tanstack/react-router";

import { appConfig } from "@/lib/config";
import { createMetadata } from "@/lib/metadata";
import { HeroText } from "@/components/ui/hero-shutter-text";

export const Route = createFileRoute("/_public/")({
	head: () => createMetadata({ title: appConfig.appName, description: appConfig.defaultDescription, pathname: "/" }),
	component: LandingPage,
});

function LandingPage() {
	return (
		<main className="h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950">
			<HeroText />
		</main>
	);
}
