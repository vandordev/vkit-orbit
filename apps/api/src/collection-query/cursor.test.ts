import { expect, test } from "bun:test";

import { createQueryFingerprint, decodeCursor, encodeCursor } from "./cursor";

test("round-trips a versioned cursor position", () => {
	const fingerprint = createQueryFingerprint({ sort: ["-createdAt", "-id"], filters: { status: "paid" }, search: undefined });
	const cursor = encodeCursor({
		position: { createdAt: "2026-01-01T00:00:00.000Z", id: "ord_1" },
		fingerprint,
	});

	expect(decodeCursor(cursor, fingerprint)).toEqual({ createdAt: "2026-01-01T00:00:00.000Z", id: "ord_1" });
});

test("rejects a cursor from a different normalized collection query", () => {
	const cursor = encodeCursor({
		position: { createdAt: "2026-01-01T00:00:00.000Z", id: "ord_1" },
		fingerprint: createQueryFingerprint({ sort: ["-createdAt", "-id"], filters: { status: "paid" }, search: undefined }),
	});

	expect(() =>
		decodeCursor(cursor, createQueryFingerprint({ sort: ["-createdAt", "-id"], filters: { status: "draft" }, search: undefined })),
	).toThrow("Invalid collection cursor");
});
