import { expect, test } from "bun:test";
import { publicWebConfigSchema } from "./public";
test("strict public schema never permits server fields", () => {
	expect(publicWebConfigSchema.parse({ realtimeUrl: "http://localhost:4102" })).toEqual({ realtimeUrl: "http://localhost:4102" });
	expect(publicWebConfigSchema.safeParse({ realtimeUrl: "http://localhost:4102", database: "forbidden" }).success).toBe(false);
});
