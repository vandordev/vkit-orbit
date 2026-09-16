import { describe, expect, test } from "bun:test";
describe("developer workspace UI contract", () => {
	test("keeps secrets one-time and exposes workspace administration", async () => {
		const keys = await Bun.file(new URL("./developers/api-keys/index.tsx", import.meta.url)).text();
		const members = await Bun.file(new URL("./settings/members/index.tsx", import.meta.url)).text();
		expect(keys).toContain("shown once");
		expect(keys).toContain("Revoke");
		expect(keys).toContain("Rotate");
		expect(members).toContain("Members");
	});
});
