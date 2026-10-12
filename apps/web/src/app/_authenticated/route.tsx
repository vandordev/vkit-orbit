import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { trpc } from "@/trpc/client";
import { z } from "zod";
export const Route = createFileRoute("/_authenticated")({
	// Session verification uses the same-origin browser client. Do not render the
	// dashboard on the server before that guard has established access.
	ssr: false,
	validateSearch: z.object({ workspaceId: z.string().min(1).optional() }),
	beforeLoad: async () => {
		if (typeof window !== "undefined" && !(await trpc.auth.status.query()).authenticated) throw redirect({ to: "/sign-in" });
	},
	component: () => <Outlet />,
});
