import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "../-components/auth-form";
import { createMetadata } from "@/lib/metadata";
export const Route = createFileRoute("/_public/sign-in/")({
	head: () => createMetadata({ title: "Sign in", description: "Sign in to your document workspace." }),
	component: () => <AuthForm mode="sign-in" />,
});
