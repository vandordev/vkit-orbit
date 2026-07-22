import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackStart({ router: { routeFileIgnorePattern: "\\.test\\." } }),
		nitro({ preset: "bun" }),
		react(),
	],
	resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
