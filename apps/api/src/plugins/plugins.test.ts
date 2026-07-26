import { expect, test } from "bun:test";

import { blockedPathsPlugin } from "./blocked-paths";
import { documentationAuthPlugin } from "./documentation-auth";
import { errorEnvelopePlugin } from "./error-envelope";
import { requestContextPlugin } from "./request-context";

test("exports named platform plugins", () => {
	expect(blockedPathsPlugin.config.name).toBe("blocked-paths");
	expect(documentationAuthPlugin.config.name).toBe("documentation-auth");
	expect(errorEnvelopePlugin.config.name).toBe("error-envelope");
	expect(requestContextPlugin.config.name).toBe("request-context");
});
