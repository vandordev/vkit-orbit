import { expect, test } from "bun:test";

import { fanoutDeliveryJob } from "../files/packages/queue/src/fanout-delivery";

test("uses the versioned kind and rejects missing identity", () => {
  expect(fanoutDeliveryJob.kind).toBe("fanout-delivery.v1");
  expect(() => fanoutDeliveryJob.schema.parse({ parentId: "p1" })).toThrow();
  expect(fanoutDeliveryJob.schema.parse({ parentId: "p1", itemId: "i1", idempotencyKey: "p1:i1" })).toEqual({ parentId: "p1", itemId: "i1", idempotencyKey: "p1:i1" });
});
