import { createFileRoute, redirect } from "@tanstack/react-router";
import { legacyDashboardHref } from "@/lib/legacy-dashboard-redirect";

export const Route = createFileRoute("/app/$")({
	beforeLoad: ({ location }) => {
		throw redirect({ href: legacyDashboardHref(location), replace: true });
	},
});
