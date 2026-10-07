import { expect, test } from "bun:test";
import * as main from "./main";
import { createDocumentHandlers } from "./main";
import { jobContracts } from "@repo/queue";

test("production worker wires every document processing stage", () => {
	const handlers = createDocumentHandlers({}, {} as never);
	expect(Object.keys(handlers).sort()).toEqual(["document.analyze.v1", "document.finalize.v1", "document.validate.v1"]);
});

test("production registry consumes every scheduled and versioned job", async () => {
	expect("createRuntimeHandlers" in main).toBe(true);
	const handlers = main.createRuntimeHandlers({
		database: {} as never,
		storage: {} as never,
		publish: async () => {},
		deliver: async () => 204,
	});
	for (const name of Object.keys(jobContracts) as (keyof typeof jobContracts)[]) expect(handlers[name]).toBeFunction();
});
