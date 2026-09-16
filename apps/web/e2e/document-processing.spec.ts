import { expect, test } from "@playwright/test";

const quarterlyNotes = `# Quarterly Notes

Operations remained stable.

## Follow-up

Review the recovery exercise.
`;

test("processes the exact Quarterly Notes fixture and downloads its report", async ({ page }) => {
	await page.goto("/app/documents/new");
	await page
		.getByLabel("Choose a .txt or .md document")
		.setInputFiles({ name: "quarterly-notes.md", mimeType: "text/markdown", buffer: Buffer.from(quarterlyNotes) });
	await expect(page.getByText("Uploading document")).toBeVisible();
	await page.getByRole("button", { name: "Confirm upload" }).click();
	await expect(page.getByText("Analyzing document")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Quarterly Notes", exact: true })).toBeVisible();
	await expect(page.getByText("Quarterly Notes · Follow-up", { exact: true })).toBeVisible();
	await expect(page.locator("[data-word-count]")).toHaveCount(1);
	await expect(page.locator("[data-line-count]")).toHaveCount(1);
	await expect(page.locator("[data-sha256]")).toHaveText(/^[a-f0-9]{64}$/);
	const download = page.waitForEvent("download");
	await page.getByRole("link", { name: "Download result JSON" }).click();
	const downloaded = await (await download).createReadStream();
	expect(downloaded).toBeTruthy();
});
