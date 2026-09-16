import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createFileRoute } from "@tanstack/react-router";
import { assertSameOrigin } from "../../server/origin";
import { createTRPCContext } from "../../trpc/context";
import { appRouter } from "../../trpc/routers";

const handle = ({ request }: { request: Request }) => {
	assertSameOrigin(request);
	return fetchRequestHandler({
		endpoint: "/trpc",
		req: request,
		router: appRouter,
		createContext: ({ req }) => createTRPCContext({ req }),
	});
};
export const Route = createFileRoute("/trpc/$")({ server: { handlers: { GET: handle, POST: handle, OPTIONS: handle } } });
