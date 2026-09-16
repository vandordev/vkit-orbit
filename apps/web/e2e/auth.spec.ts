import { expect, test } from "@playwright/test";

test("public authentication pages render through the real web service", async ({ page }) => {
	await page.goto("/sign-in");
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
});

test("registers and signs in through same-origin tRPC", async ({ page }) => {
	const email = `e2e-${Date.now()}@example.test`;
	await page.goto("/register");
	await page.getByLabel("Email address").fill(email);
	await page.getByLabel("Password").fill("correct horse battery staple");
	await page.getByLabel("Your name").fill("E2E User");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/app\/documents\/new\?workspaceId=ws_/);
	await page.context().clearCookies();
	await page.goto("/sign-in");
	await page.getByLabel("Email address").fill(email);
	await page.getByLabel("Password").fill("correct horse battery staple");
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/app\/documents\/new\?workspaceId=ws_/);
});
