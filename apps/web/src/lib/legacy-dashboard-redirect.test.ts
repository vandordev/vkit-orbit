import { describe, expect, test } from "bun:test";
import { legacyDashboardHref } from "./legacy-dashboard-redirect";

// Preserved regression coverage; execution requires separate system-test approval.
describe("legacy dashboard redirects", () => {
	for (const pathname of ["/app", "/app/", "/app/overview", "/app/overview/"]) {
		test(`${pathname} opens Overview`, () => {
			expect(legacyDashboardHref({ pathname, searchStr: "?workspaceId=ws_one", hash: "section" })).toBe("/?workspaceId=ws_one#section");
		});
	}
	test("preserves nested paths, raw query and hash", () => {
		expect(legacyDashboardHref({ pathname: "/app/documents/doc_one/runs/run_one", searchStr: "?q=a%26b&size=10", hash: "report" })).toBe(
			"/documents/doc_one/runs/run_one?q=a%26b&size=10#report",
		);
	});
	for (const pathname of ["/app//example.test", "/app/\\example.test"]) {
		test(`${pathname} cannot redirect outside this origin`, () => {
			expect(legacyDashboardHref({ pathname, searchStr: "", hash: "" })).toBe("/");
		});
	}
});
