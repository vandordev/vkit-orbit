import { expect, test } from "bun:test";

import { sessionCookie } from "./cookies";

test("creates an opaque host-only secure session cookie", () => {
	const header = sessionCookie("ses_test");
	expect(header).toMatch(/^session=ses_test;/);
	expect(header).toMatch(/HttpOnly/);
	expect(header).toMatch(/Secure/);
	expect(header).toMatch(/SameSite=Lax/);
	expect(header).not.toMatch(/Domain=/i);
});
