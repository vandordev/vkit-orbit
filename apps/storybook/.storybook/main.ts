import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { discoverStories } from "./discovery.ts";

const config: StorybookConfig = {
	framework: "@storybook/react-vite",
	stories: async () => discoverStories(fileURLToPath(new URL("../../../", import.meta.url)), fileURLToPath(new URL("./", import.meta.url))),
	core: { disableTelemetry: true },
	viteFinal: async (config) => {
		config.plugins = [...(config.plugins ?? []), tailwindcss()];
		config.resolve = {
			...config.resolve,
			alias: { ...config.resolve?.alias, "@": fileURLToPath(new URL("../../web/src/", import.meta.url)) },
			dedupe: [...(config.resolve?.dedupe ?? []), "react", "react-dom"],
		};
		return config;
	},
};

export default config;
