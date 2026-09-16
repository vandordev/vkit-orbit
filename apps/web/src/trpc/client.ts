import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./routers";

export function createTRPCClient(origin = typeof window === "undefined" ? "http://localhost" : window.location.origin) {
	const client = createTRPCProxyClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${origin}/trpc`,
				fetch(url, options) {
					return fetch(url, { ...options, credentials: "same-origin" });
				},
			}),
		],
	});
	return client;
}

export const trpcEndpoint = (origin: string) => `${origin}/trpc`;

export const trpc = createTRPCClient();
