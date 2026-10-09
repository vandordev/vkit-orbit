import { getPublicWebConfig } from "@repo/config/server";
import { publicWebConfigSchema, type PublicWebConfig } from "@repo/config/public";
export function getPublicConfig(): PublicWebConfig {
	const { realtimeUrl } = getPublicWebConfig();
	return publicWebConfigSchema.parse({ realtimeUrl });
}
