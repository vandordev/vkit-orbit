import { createIsomorphicFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { treaty } from "@elysia/eden";

import { app } from "@repo/api";
import type { App } from "@repo/api";

type ApiClient = ReturnType<typeof treaty<App>>["api"];
type IsomorphicApiFactory = () => ApiClient;

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
	server: {
		handlers: {
			GET: handle,
			POST: handle,
			PUT: handle,
			PATCH: handle,
			DELETE: handle,
			OPTIONS: handle,
			HEAD: handle,
		},
	},
});

export const getTreaty: IsomorphicApiFactory = createIsomorphicFn()
	.server(() => treaty(app).api)
	.client(() => treaty<App>(window.location.origin).api);
