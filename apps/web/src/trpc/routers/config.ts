import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicWebConfigSchema } from "@repo/config/public";
import { getPublicConfig } from "../../server/public-config";
import { publicProcedure, router } from "../init";
export const configRouter = router({
	public: publicProcedure.input(z.undefined()).output(publicWebConfigSchema).query(() => {
		try { return getPublicConfig(); } catch { throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Runtime configuration unavailable" }); }
	}),
});
