import { chromium, expect } from "@playwright/test";
import { loadingVariants } from "../packages/components/src/components/ui/loading-variants";

// Uses the existing permission-managed Storybook; never starts or stops a server.
const origin = "http://127.0.0.1:6006";
const response = await fetch(`${origin}/index.json`);
if (!response.ok) throw new Error(`Storybook index returned ${response.status}`);
const index: { entries: Record<string, { id: string; type: string; title: string }> } = await response.json();
const stories = Object.values(index.entries).filter((entry) => entry.type === "story" && entry.title === "Vandor UI/Loading");
expect(stories).toHaveLength(6);
const browser = await chromium.launch();
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
	if (message.type() === "error") errors.push(message.text());
});
const open = async (story: string, args = "") => {
	await page.goto(`${origin}/iframe.html?id=vandor-ui-loading--${story}&viewMode=story${args ? `&args=${args}` : ""}`);
	await page.locator('[data-slot="loading"]').first().waitFor();
};

try {
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 844 });
		for (const story of stories) {
			await page.goto(`${origin}/iframe.html?id=${story.id}&viewMode=story`);
			await page.locator('[data-slot="loading"]').first().waitFor();
			expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
		}
	}
	await open("all-variants");
	await expect(page.getByRole("status")).toHaveCount(loadingVariants.length);
	for (const variant of loadingVariants) {
		const loading = page.locator(`[data-slot="loading"][data-variant="${variant}"]`);
		await expect(loading).toHaveAttribute("aria-label", `Loading: ${variant}`);
		await expect(loading.locator('[data-slot="loading-visual"]')).toHaveAttribute("aria-hidden", "true");
		expect(await loading.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(0);
		expect(await loading.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(0);
	}
	expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
	await open("playground", "size:48;duration:2");
	const arc = page.locator('[data-slot="loading-visual"] > div');
	await expect(arc).toHaveCSS("width", "48px");
	await expect(arc).toHaveCSS("animation-duration", "2s");
	await open("variant-options");
	await expect(page.locator('[data-slot="loading-visual"] > span > span[aria-hidden="true"]')).toHaveCount(5);

	await page.emulateMedia({ reducedMotion: "reduce" });
	await open("all-variants");
	await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
	for (const variant of loadingVariants) {
		const visual = page.locator(`[data-variant="${variant}"] [data-slot="loading-visual"]`);
		if (variant.startsWith("text-")) await expect(visual).toHaveText("Loading");
		else await expect(visual.locator("svg")).toBeVisible();
	}
	await open("text");
	await expect(page.getByRole("status", { name: "Preparing document" })).toHaveText("Preparing document");
	await open("with-button");
	const button = page.getByRole("button", { name: "Saving" });
	await expect(button).toBeDisabled();
	await expect(button).toHaveAttribute("aria-busy", "true");
	await expect(button.locator('[data-slot="loading-visual"] svg')).toBeVisible();
	expect(errors).toEqual([]);
	console.log(
		`PASS: 6 Loading stories, ${loadingVariants.length} variants, desktop/mobile overflow, labeled status, sizing/duration, typed variant options, static reduced-motion fallback, and Button integration.`,
	);
} finally {
	await browser.close();
}
