import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: PublicPage });

function PublicPage() {
	return <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-24"><p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Vandor Orbit</p><h1 className="text-4xl font-semibold tracking-tight">A focused starting point for your next product.</h1><p className="max-w-xl text-lg text-muted-foreground">TanStack Start, embedded Elysia, and typed runtime boundaries in one domain-neutral workspace.</p><Button>Start building</Button></main>;
}
