import { expect, test } from "bun:test";
import { buildDocumentReport } from "./types";
test("builds stable document metrics and heading title", () => {
	const report = buildDocumentReport("# Hello\n\nread this document");
	expect(report.title).toBe("Hello");
	expect(report.headings).toEqual(["Hello"]);
	expect(report.words).toBe(5);
	expect(report.readingTimeMinutes).toBe(1);
});
