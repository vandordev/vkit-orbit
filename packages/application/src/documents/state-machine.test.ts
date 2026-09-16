import { expect, test } from "bun:test";
import { assertTransition } from "./state-machine";

test("allows only the durable document processing transitions", () => {
	expect(() => assertTransition("UPLOADING", "READY")).not.toThrow();
	expect(() => assertTransition("READY", "QUEUED")).not.toThrow();
	expect(() => assertTransition("QUEUED", "CANCELED")).not.toThrow();
	expect(() => assertTransition("QUEUED", "COMPLETED")).toThrow();
	expect(() => assertTransition("COMPLETED", "QUEUED")).toThrow();
});

test("rejects stale command revisions and unsupported uploads", () => {
	expect(() => assertTransition("READY", "QUEUED", 2, 1)).toThrow("stale revision");
});
