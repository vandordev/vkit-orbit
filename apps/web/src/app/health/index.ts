import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health/")({
	server: { handlers: { GET: () => Response.json({ success: true, data: { status: "healthy", timestamp: new Date().toISOString() } }) } },
});
