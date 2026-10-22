import { useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { trpc } from "../../../trpc/client";
import { AuthFormView } from "./auth-form-view";

export function AuthForm({ mode }: { mode: "sign-in" | "register" }) {
	const isSignIn = mode === "sign-in";
	const navigate = useNavigate();
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const values = Object.fromEntries(new FormData(event.currentTarget));
		void (
			isSignIn
				? trpc.auth.signIn.mutate({ email: String(values.email), password: String(values.password) })
				: trpc.auth.register.mutate({ email: String(values.email), password: String(values.password), name: String(values.name) })
		)
			.then((result) => navigate({ to: "/", search: { workspaceId: result.workspaceId } }))
			.catch(() => document.querySelector('[role="alert"]')?.classList.remove("hidden"));
	}
	return <AuthFormView mode={mode} onSubmit={submit} />;
}
