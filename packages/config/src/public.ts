import { z } from "zod";

export const realtimeOriginSchema = z.string().url().refine(value => {
	const url = new URL(value);
	return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.hash && !url.search && url.pathname === "/";
}, "expected an HTTP(S) origin without credentials");
export const publicWebConfigSchema = z.strictObject({ realtimeUrl: realtimeOriginSchema });
export type PublicWebConfig = z.output<typeof publicWebConfigSchema>;
