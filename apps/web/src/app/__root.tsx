import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/query-provider";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
	head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "Application Workspace" }], links: [{ rel: "stylesheet", href: appCss }] }),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	return <html lang="en"><head><HeadContent /></head><body className="min-h-screen bg-background text-foreground"><QueryProvider>{children}</QueryProvider><Scripts /></body></html>;
}
