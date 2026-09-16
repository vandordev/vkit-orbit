import { expect, test } from "bun:test";
import { canonicalRequestHash } from "./execute-idempotent";

test("canonical request hashing is independent of object key order", () => {
	expect(canonicalRequestHash({ b: 2, a: 1 })).toBe(canonicalRequestHash({ a: 1, b: 2 }));
});
