import { createFileRoute } from "@tanstack/react-router";

import { appConfig } from "@/lib/config";
import { createMetadata } from "@/lib/metadata";
import { ArchitectureMap } from "./-components/architecture-map";
import { OrbitHero } from "./-components/orbit-hero";
import { PublicHeader } from "./-components/public-header";

export const Route = createFileRoute("/_public/")({
	head: () => createMetadata({ title: appConfig.appName, description: appConfig.defaultDescription, pathname: "/" }),
	component: LandingPage,
});

function LandingPage() {
	return <div className="min-h-screen bg-[#080b13] text-slate-100"><PublicHeader /><main><OrbitHero /><ArchitectureMap /></main></div>;
}
