import { expect, test } from "bun:test";

import { signRealtimeTicket, verifyRealtimeTicket } from "./ticket";

test("rejects corrupted signatures and invalid claim dates", () => {
	const ticket = signRealtimeTicket({ subjectId: "user", expiresAt: "2099-01-01T00:00:00.000Z" }, "secret");
	expect(() => verifyRealtimeTicket(`${ticket}x`, "secret")).toThrow("Invalid realtime ticket");
	expect(() => signRealtimeTicket({ subjectId: "user", expiresAt: "invalid" }, "secret")).toThrow();
});

test("rejects an expired ticket", () => {
	const secret = "secret";
	const expiredTicket = signRealtimeTicket({ subjectId: "user-1", expiresAt: new Date(Date.now() - 1_000).toISOString() }, secret);

	expect(() => verifyRealtimeTicket(expiredTicket, secret)).toThrow("Expired realtime ticket");
});

test("verifies a valid ticket", () => {
	const secret = "secret";
	const claims = { subjectId: "user-1", expiresAt: new Date(Date.now() + 60_000).toISOString() };

	expect(verifyRealtimeTicket(signRealtimeTicket(claims, secret), secret)).toEqual(claims);
});
