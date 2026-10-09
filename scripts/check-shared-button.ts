import { chromium, expect } from "@playwright/test";

// Explicit browser check against the permission-managed server. Never starts one.
const origin = "http://127.0.0.1:6006";
const response = await fetch(`${origin}/index.json`);
if (!response.ok) throw new Error(`Storybook index returned ${response.status}`);
const index: { entries: Record<string, { id: string; type: string; title: string }> } = await response.json();
const stories = Object.values(index.entries).filter((entry) => entry.type === "story" && entry.title === "Vandor UI/Button");
if (stories.length !== 9) throw new Error(`Expected nine Vandor Button stories, got ${stories.length}`);

const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: "dark", reducedMotion: "reduce" });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
const open = async (name: string) => {
	await page.goto(`${origin}/iframe.html?id=vandor-ui-button--${name}&viewMode=story`);
	await page.locator('[data-slot="button"]').first().waitFor();
};

try {
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 844 });
		for (const story of stories) {
			await page.goto(`${origin}/iframe.html?id=${story.id}&viewMode=story`);
			await page.locator('[data-slot="button"]').first().waitFor();
			expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
		}
	}
	await open("variants");
	const destructive = page.getByRole("button", { name: "destructive", exact: true });
	const background = () => destructive.evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(await background()).not.toContain("/ 0.6");
	await page.evaluate(() => document.documentElement.classList.add("dark"));
	await expect.poll(background).toContain("/ 0.6");

	await open("playground");
	const button = page.getByRole("button", { name: "Button", exact: true });
	await button.evaluate((element) => {
		element.setAttribute("data-clicks", "0");
		element.addEventListener("click", () => element.setAttribute("data-clicks", String(Number(element.getAttribute("data-clicks")) + 1)));
	});
	await page.keyboard.press("Tab");
	await expect(button).toBeFocused();
	expect(await button.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
	await page.keyboard.press("Enter");
	await page.keyboard.press("Space");
	await expect(button).toHaveAttribute("data-clicks", "2");
	expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe("none");

	await open("disabled");
	await expect(page.getByRole("button")).toBeDisabled();
	await open("loading");
	const loading = page.getByRole("button", { name: "Saving", exact: true });
	await expect(loading).toBeDisabled();
	await expect(loading).toHaveAttribute("aria-busy", "true");
	await expect(loading.locator('[data-slot="loading"] svg')).toBeVisible();

	await open("as-link");
	const link = page.getByRole("link", { name: "Browse components" });
	await expect(link).toHaveAttribute("href", "#button-story");
	await expect(page.getByRole("button")).toHaveCount(0);
	await page.keyboard.press("Tab");
	await expect(link).toBeFocused();
	await page.keyboard.press("Enter");
	expect(new URL(page.url()).hash).toBe("#button-story");
	// Exercise the upstream link loading state through normal story controls.
	await page.goto(`${origin}/iframe.html?id=vandor-ui-button--as-link&viewMode=story&args=isLoading:true`);
	const pendingLink = page.getByRole("link", { name: "Browse components" });
	await expect(pendingLink).toHaveAttribute("aria-busy", "true");
	await expect(pendingLink).toHaveAttribute("aria-disabled", "true");
	await pendingLink.evaluate((element: HTMLElement) => element.click());
	expect(new URL(page.url()).hash).toBe("");
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await open("loading");
	await expect(page.locator('[data-slot="loading-visual"] > div')).toBeVisible();
	expect(errors).toEqual([]);
	console.log(
		"PASS: 9 shared Button stories; desktop/mobile overflow, theme isolation, keyboard/focus, disabled/loading, link semantics, and reduced motion.",
	);
} finally {
	await browser.close();
}
