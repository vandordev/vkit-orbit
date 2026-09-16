import { Link } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { trpc } from "../../../trpc/client";
import { useNavigate } from "@tanstack/react-router";

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
			.then((result) => navigate({ to: "/app/documents/new", search: { workspaceId: result.workspaceId } }))
			.catch(() => document.querySelector('[role="alert"]')?.classList.remove("hidden"));
	}
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
			<section className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
				<Link to="/" className="text-sm font-semibold text-primary">
					Vkit Orbit
				</Link>
				<h1 className="mt-8 text-3xl font-semibold tracking-tight">{isSignIn ? "Sign in" : "Create your account"}</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					{isSignIn ? "Return to your document workspace." : "Start processing plain text documents."}
				</p>
				<form className="mt-8 space-y-5" onSubmit={submit}>
					<label className="grid gap-2 text-sm font-medium" htmlFor="email">
						Email address
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							className="h-11 rounded-md border border-border bg-background px-3 focus-visible:ring-2"
						/>
					</label>
					<label className="grid gap-2 text-sm font-medium" htmlFor="password">
						Password
						<input
							id="password"
							name="password"
							type="password"
							autoComplete={isSignIn ? "current-password" : "new-password"}
							required
							minLength={12}
							className="h-11 rounded-md border border-border bg-background px-3 focus-visible:ring-2"
						/>
					</label>
					{!isSignIn && (
						<label className="grid gap-2 text-sm font-medium" htmlFor="name">
							Your name
							<input
								id="name"
								name="name"
								autoComplete="name"
								required
								className="h-11 rounded-md border border-border bg-background px-3 focus-visible:ring-2"
							/>
						</label>
					)}
					<p role="alert" className="hidden rounded-md bg-red-50 p-3 text-sm text-red-800">
						We could not complete that request. Check your details and try again.
					</p>
					<button type="submit" className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground focus-visible:ring-2">
						{isSignIn ? "Sign in" : "Create account"}
					</button>
				</form>
				<p className="mt-6 text-center text-sm text-muted-foreground">
					{isSignIn ? "New here? " : "Already have an account? "}
					<Link className="font-medium text-primary underline" to={isSignIn ? "/register" : "/sign-in"}>
						{isSignIn ? "Create an account" : "Sign in"}
					</Link>
				</p>
			</section>
		</main>
	);
}
