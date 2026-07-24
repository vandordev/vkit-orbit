import { expect, test } from "bun:test";

test("recipe documents every deliberate integration point", async () => {
	const readme = await Bun.file(new URL("../README.md", import.meta.url)).text();

	for (const section of ["Queue contract", "API registration", "Scheduler registration", "Worker registration", "Web route registration", "Removal"]) {
		expect(readme).toContain(section);
	}
});
