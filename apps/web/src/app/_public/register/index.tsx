import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "../-components/auth-form";
import { createMetadata } from "@/lib/metadata";
export const Route = createFileRoute("/_public/register/")({
	head: () => createMetadata({ title: "Create account", description: "Create your document workspace." }),
	component: () => <AuthForm mode="register" />,
});
