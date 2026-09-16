import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { trpc } from "@/trpc/client";
export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		if (typeof window !== "undefined" && !(await trpc.auth.status.query()).authenticated) throw redirect({ to: "/sign-in" });
	},
	component: () => <Outlet />,
});
