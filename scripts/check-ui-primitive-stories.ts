import { chromium, expect } from "@playwright/test";

// Explicit UI-only probe against an already-authorized Storybook; never starts services.
const origin = "http://127.0.0.1:6006";
const response = await fetch(`${origin}/index.json`);
if (!response.ok) throw new Error(`Storybook index returned ${response.status}`);
const index: { entries: Record<string, { id: string; type: string; title: string }> } = await response.json();
const titles = new Set([
	"Vandor UI/Input",
	"Vandor UI/Table",
	"Web/Components/DocumentTable",
	"Web/Components/StatusTimeline",
	"Web/Components/UploadWorkflow",
	"Web/Pages/Auth",
	"Web/Pages/Developers/ApiKeys",
	"Web/Pages/Settings/Workspace",
	"Web/Pages/Documents/Collection",
	"Web/Pages/Documents/RunDetail",
	"Web/Components/HeroText",
]);
const stories = Object.values(index.entries).filter((entry) => entry.type === "story" && titles.has(entry.title));
for (const title of titles) if (!stories.some((entry) => entry.title === title)) throw new Error(`Missing story: ${title}`);
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
	if (new URL(request.url()).pathname.startsWith("/trpc")) errors.push("Story attempted a real API request");
});
async function open(id: string) {
	await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story`);
	await page.locator("#storybook-root").waitFor();
	await expect(page.locator("#storybook-root")).not.toBeEmpty();
	await expect(page.locator(".sb-errordisplay")).not.toBeVisible();
}
try {
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 844 });
		for (const story of stories) {
			await open(story.id);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${story.id} overflow at ${width}`).toBe(true);
		}
	}
	await open("vandor-ui-input--form");
	const title = page.getByRole("textbox", { name: "Document title" });
	await page.keyboard.press("Tab");
	await expect(title).toBeFocused();
	expect(await title.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
	await title.fill("Updated local title");
	await page.getByRole("button", { name: "Save title", exact: true }).click();
	await expect(page.getByRole("status")).toHaveText("Saved: Updated local title");
	await page.getByRole("button", { name: "Focus title", exact: true }).click();
	await expect(title).toBeFocused();
	await open("vandor-ui-input--disabled");
	await expect(page.getByRole("textbox")).toBeDisabled();
	await open("vandor-ui-input--invalid");
	await expect(page.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
	await expect(page.getByRole("textbox")).toHaveAccessibleDescription("Enter a document title.");
	await open("vandor-ui-input--file");
	await page
		.getByLabel("Choose a .txt or .md document")
		.setInputFiles({ name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from("# Notes") });
	await expect(page.getByRole("status")).toHaveText("notes.md");
	await open("web-components-uploadworkflow--local-interaction");
	await page
		.getByLabel("Choose a .txt or .md document")
		.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("Notes") });
	await page.getByRole("button", { name: "Confirm upload" }).click();
	await expect(page.getByText("Analyzing document", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Confirm upload" })).toHaveCount(0);
	await open("web-pages-auth--register");
	await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
	await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "12");
	await page.getByLabel("Email address").fill("avery@example.test");
	await page.getByLabel("Password").fill("local-fixture-password");
	await page.getByLabel("Your name").fill("Avery");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
	await page.screenshot({ path: "/tmp/opencode/primitive-auth-mobile.png", fullPage: true });
	await open("web-components-documenttable--populated");
	await expect(page.getByRole("table", { name: "Documents" })).toBeVisible();
	await expect(page.getByRole("columnheader")).toHaveCount(3);
	await expect(page.getByRole("link", { name: "View" }).first()).toHaveAttribute("href", /\/documents\/fixture-report/);
	await page.screenshot({ path: "/tmp/opencode/primitive-table-mobile.png", fullPage: true });
	await page.setViewportSize({ width: 1280, height: 844 });
	await open("web-pages-documents-collection--empty");
	await page.screenshot({ path: "/tmp/opencode/primitive-documents-desktop.png", fullPage: true });
	expect(errors).toEqual([]);
	console.log(
		`PASS: ${stories.length} affected stories at desktop/mobile; form submit, ref/focus, disabled/invalid, file selection, local upload stages, auth constraints and table semantics. No page errors/API requests.`,
	);
} finally {
	await browser.close();
}
