import { expect, test } from "bun:test";
import { createDocumentHandlers } from "./main";

test("production worker wires every document processing stage", () => {
	const handlers = createDocumentHandlers({}, {} as never);
	expect(Object.keys(handlers).sort()).toEqual(["document.analyze.v1", "document.finalize.v1", "document.validate.v1"]);
});
