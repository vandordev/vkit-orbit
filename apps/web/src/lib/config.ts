import { brand } from "@repo/brand";

export const appConfig = {
	appName: brand.name,
	defaultTitle: brand.name,
	defaultDescription: "A focused workspace for turning plain text into useful document insights.",
	favicon: "/favicon.ico",
	repositoryUrl: "https://github.com/vandordev/vx",
} as const;
