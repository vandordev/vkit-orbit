import { expect, test } from "bun:test";
import { hashPassword, verifyPassword } from "./password";
test("uses Argon2id password hashes", async () => {
	const hash = await hashPassword("correct horse");
	expect(hash).toContain("argon2id");
	expect(await verifyPassword("correct horse", hash)).toBe(true);
	expect(await verifyPassword("wrong", hash)).toBe(false);
});
