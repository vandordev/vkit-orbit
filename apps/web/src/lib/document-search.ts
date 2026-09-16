import { z } from "zod";
export const documentSearchSchema = z.object({
	q: z.string().optional(),
	status: z.enum(["UPLOADING", "READY", "FAILED"]).optional(),
	size: z.coerce.number().int().min(1).max(100).default(25),
	after: z.string().optional(),
});
export type DocumentSearch = z.infer<typeof documentSearchSchema>;
