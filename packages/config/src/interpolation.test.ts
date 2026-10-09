import { expect, test } from "bun:test";
import { interpolateSelected, validateTemplates } from "./interpolation";
const diagnostic = { filePath: "/fixture/config.yaml", runtime: "web" };
test("single-pass interpolation treats inserted values as literal data", () => {
	expect(interpolateSelected("${PASSWORD}", { PASSWORD: "x:#\n${NEXT}" }, diagnostic)).toBe("x:#\n${NEXT}");
	expect(interpolateSelected("$${PASSWORD}", {}, diagnostic)).toBe("${PASSWORD}");
	for (const env of [{}, { PORT: "" }]) expect(interpolateSelected("${PORT:-4100}", env, diagnostic)).toBe("4100");
	expect(interpolateSelected("${OPTIONAL:-}", {}, diagnostic)).toBe("");
	expect(() => interpolateSelected("${PASSWORD}", {}, diagnostic)).toThrow("PASSWORD");
});
test("rejects malformed original templates without leaking values", () => {
	for (const input of ["${lower}", "${NAME", "${NAME:-${OTHER}}", "${NAME:bad}"]) expect(() => validateTemplates(input, diagnostic)).toThrow("malformed template");
});
