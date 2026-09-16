import { describe, expect, test } from "bun:test";
import { documentValidateV1, parseJobPayload, createJobId, jobContracts, retryDelay } from "./index";

describe("BullMQ contracts", () => {
	test("parses the exact versioned stage payload", () => {
		expect(parseJobPayload("document.validate.v1", { workspaceId: "ws_1", runId: "run_1", revision: 1 })).toEqual({
			workspaceId: "ws_1",
			runId: "run_1",
			revision: 1,
		});
		expect(createJobId(documentValidateV1, "run_1", 1)).toBe("document.validate.v1__run_1__1");
	});
	test("rejects malformed payloads and job identities", () => {
		expect(() => parseJobPayload("document.validate.v1", { workspaceId: "ws", runId: "run", revision: 1, extra: true })).toThrow();
		expect(() => createJobId(documentValidateV1, "", 1)).toThrow();
		expect(() => createJobId("document.validate.v1", "run:x", 1)).toThrow();
		expect(() => createJobId("document.validate", "run", 1)).toThrow();
	});
	test("publishes every approved contract with bounded deterministic retry", () => {
		expect(Object.keys(jobContracts)).toHaveLength(7);
		expect(retryDelay(1)).toBe(1_000);
		expect(retryDelay(20)).toBe(60_000);
	});
});
