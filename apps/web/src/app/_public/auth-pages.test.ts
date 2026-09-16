import { describe, expect, test } from "bun:test";

describe("authentication workspace shell contract", () => {
	test("provides public sign-in and registration routes", async () => {
		const signIn = await Bun.file(new URL("./-components/auth-form.tsx", import.meta.url)).text();
		const register = await Bun.file(new URL("./register/index.tsx", import.meta.url)).text();
		expect(signIn).toContain('autoComplete="email"');
		expect(signIn).toContain('autoComplete={isSignIn ? "current-password"');
		expect(register).toContain('createFileRoute("/_public/register/")');
	});

	test("guards the application and exposes permission-aware navigation", async () => {
		const route = await Bun.file(new URL("../_authenticated/route.tsx", import.meta.url)).text();
		const shell = await Bun.file(new URL("../_authenticated/app/-components/app-shell.tsx", import.meta.url)).text();
		expect(route).toContain("beforeLoad");
		expect(route).toContain("redirect");
		expect(shell).toContain("Documents");
		expect(shell).toContain("Settings");
		expect(await Bun.file(new URL("../../styles.css", import.meta.url)).text()).toContain("prefers-reduced-motion");
	});
});
