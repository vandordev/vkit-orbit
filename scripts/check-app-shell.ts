import { chromium, expect } from "@playwright/test";

// Standalone UI probe against the explicitly authorized Storybook. No backend.
const origin = "http://127.0.0.1:6006";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
const open = async (story = "default") => {
	await page.goto(`${origin}/iframe.html?id=web-layouts-workspace--${story}&viewMode=story`);
	await page.locator('[data-slot="app-shell"]').waitFor();
};
try {
	for (const story of ["default", "collapsed", "controlled", "minimal", "keyboard"]) {
		await page.goto(`${origin}/iframe.html?id=vandor-ui-appshell--${story}&viewMode=story`);
		await page.locator('[data-slot="app-shell"]').waitFor();
		if (story !== "minimal") await expect(page.getByRole("button", { name: "Documents", exact: true })).toBeDisabled();
		if (story === "controlled") {
			await page.getByRole("button", { name: "Collapse sidebar" }).click();
			await expect(page.locator('[data-slot="app-shell"]')).toHaveAttribute("data-collapsed", "true");
		}
	}
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 844 });
		for (const story of ["default", "collapsed", "pending", "error", "no-workspace", "long-content"]) {
			await open(story);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		}
	}
	await page.setViewportSize({ width: 1280, height: 844 });
	await open();
	await expect(page.getByRole("link", { name: "Documents", exact: true })).toHaveAttribute("href", "#documents");
	await page.getByRole("button", { name: "Collapse sidebar" }).click();
	await expect(page.locator('[data-slot="app-shell"]')).toHaveAttribute("data-collapsed", "true");
	await page.getByRole("link", { name: "Documents", exact: true }).focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(page.locator('[data-slot="tooltip-content"]')).toContainText("Documents");
	await page.keyboard.press("Enter");
	expect(new URL(page.url()).hash).toBe("#documents");
	await page.setViewportSize({ width: 390, height: 844 });
	await open();
	await page.keyboard.press("Tab");
	await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("main")).toBeFocused();
	await page.getByRole("button", { name: "Open navigation" }).click();
	const drawer = page.getByRole("dialog");
	await expect(drawer).toBeVisible();
	await expect.poll(() => drawer.evaluate((node) => node.getBoundingClientRect().x)).toBe(0);
	for (let index = 0; index < 8; index++) {
		await page.keyboard.press("Tab");
		expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
	}
	await page.keyboard.press("Escape");
	await expect(drawer).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
	await page.getByRole("button", { name: "Open navigation" }).click();
	await drawer.getByRole("link", { name: "Documents", exact: true }).click();
	await expect(drawer).toHaveCount(0);
	await page.getByRole("button", { name: "Open navigation" }).click();
	await page.setViewportSize({ width: 1280, height: 844 });
	await expect(drawer).toHaveCount(0);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole("button", { name: "Open navigation" }).click();
	await expect(drawer).toBeVisible();
	expect(await drawer.evaluate((node) => Number.parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThanOrEqual(0.00001);
	await page.screenshot({ path: "/tmp/opencode/orbit-shell-mobile.png" });
	await page.keyboard.press("Escape");
	await page.setViewportSize({ width: 1280, height: 844 });
	await page.screenshot({ path: "/tmp/opencode/orbit-shell-desktop.png" });
	expect(errors).toEqual([]);
	console.log(
		"PASS: shell stories, desktop/mobile overflow, collapse, native links, tooltip, skip link, drawer navigation/Escape/focus/resize, reduced motion; no page errors.",
	);
} finally {
	await browser.close();
}
