import { createFileRoute } from "@tanstack/react-router";

import { createMetadata } from "@/lib/metadata";
import { ArchitectureMap } from "./-components/architecture-map";
import { OrbitHero } from "./-components/orbit-hero";
import { PublicHeader } from "./-components/public-header";

export const Route = createFileRoute("/_public/")({
	head: () => createMetadata({ title: "Vkit Orbit", description: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers.", pathname: "/" }),
	component: LandingPage,
});

function LandingPage() {
	return <div className="min-h-screen bg-[#080b13] text-slate-100"><PublicHeader /><main><OrbitHero /><ArchitectureMap /></main></div>;
}
