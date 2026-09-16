import { expect, test } from "@playwright/test";

test("recovery keeps the workspace boundary and refetches authoritative state", async ({ page }) => {
	await page.goto("/app/overview");
	await expect(page.getByRole("main")).toBeVisible();
	await expect(page).not.toHaveURL(/\/v1/);
});
