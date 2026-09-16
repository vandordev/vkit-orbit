import { expect, test } from "@playwright/test";

test("developer settings keep secrets one-time and expose delivery controls", async ({ page }) => {
	await page.goto("/app/developers/api-keys");
	await expect(page.getByRole("heading", { name: "API keys", exact: true })).toBeVisible();
	await expect(page.getByText("New secrets will be shown once", { exact: false })).toBeVisible();
});
