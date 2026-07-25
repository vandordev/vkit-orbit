import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/query-provider";
import { GlobalError } from "@/app/-components/global-error";
import { GlobalNotFound } from "@/app/-components/global-not-found";
import { GlobalPending } from "@/app/-components/global-pending";
import { appConfig } from "@/lib/config";
import { createMetadata } from "@/lib/metadata";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
	head: () => {
		const metadata = createMetadata({ title: appConfig.defaultTitle, description: appConfig.defaultDescription });
		return { meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, ...metadata.meta], links: [{ rel: "stylesheet", href: appCss }, { rel: "icon", href: appConfig.favicon }, ...metadata.links] };
	},
	shellComponent: RootDocument,
	errorComponent: GlobalError,
	notFoundComponent: GlobalNotFound,
	pendingComponent: GlobalPending,
});

function RootDocument({ children }: { children: ReactNode }) {
	return <html lang="en"><head><HeadContent /></head><body className="min-h-screen bg-background text-foreground"><QueryProvider>{children}</QueryProvider><Scripts /></body></html>;
}
