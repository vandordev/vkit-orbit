import { createFileRoute } from "@tanstack/react-router";

import { app } from "@repo/api";

export const Route = createFileRoute("/health")({
	server: { handlers: { GET: ({ request }: { request: Request }) => app.fetch(request) } },
});
