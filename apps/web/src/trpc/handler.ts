import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { assertSameOrigin } from "../server/origin";
import { createTRPCContext } from "./context";
import { appRouter } from "./routers";

export async function handleTRPC(request: Request): Promise<Response> {
	try { assertSameOrigin(request); } catch { return Response.json({ error: "Forbidden" }, { status: 403, headers: { "cache-control": "no-store" } }); }
	try {
		const response = await fetchRequestHandler({
			endpoint: "/trpc", req: request, router: appRouter,
			createContext: ({ req }) => createTRPCContext({ req }),
			responseMeta: ({ ctx }) => {
				const headers = new Headers(ctx?.responseHeaders);
				headers.set("cache-control", "no-store");
				return { headers };
			},
		});
		response.headers.set("cache-control", "no-store");
		return response;
	} catch { return Response.json({ error: "Request unavailable" }, { status: 500, headers: { "cache-control": "no-store" } }); }
}
