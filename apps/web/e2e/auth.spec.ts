import { expect, test } from "@playwright/test";

test("public authentication pages render through the real web service", async ({ page }) => {
	await page.goto("/sign-in");
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
});
