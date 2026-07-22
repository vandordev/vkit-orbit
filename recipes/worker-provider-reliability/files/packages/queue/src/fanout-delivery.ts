import { z } from "zod";

export const fanoutDeliveryJob = {
  kind: "fanout-delivery.v1" as const,
  schema: z.object({
    parentId: z.string().min(1),
    itemId: z.string().min(1),
    idempotencyKey: z.string().min(1),
  }),
};

export type FanoutDeliveryPayload = z.infer<typeof fanoutDeliveryJob.schema>;
