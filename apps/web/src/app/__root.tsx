import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/query-provider";
import { GlobalError } from "@/app/-components/global-error";
import { GlobalNotFound } from "@/app/-components/global-not-found";
import { GlobalPending } from "@/app/-components/global-pending";
import { createMetadata } from "@/lib/metadata";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
	head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, ...createMetadata({ title: "Vkit Orbit", description: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers." }).meta], links: [{ rel: "stylesheet", href: appCss }, { rel: "icon", href: "/favicon.ico" }, ...createMetadata({ title: "Vkit Orbit", description: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers." }).links] }),
	shellComponent: RootDocument,
	errorComponent: GlobalError,
	notFoundComponent: GlobalNotFound,
	pendingComponent: GlobalPending,
});

function RootDocument({ children }: { children: ReactNode }) {
	return <html lang="en"><head><HeadContent /></head><body className="min-h-screen bg-background text-foreground"><QueryProvider>{children}</QueryProvider><Scripts /></body></html>;
}
