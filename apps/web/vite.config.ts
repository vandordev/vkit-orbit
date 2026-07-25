import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// TanStack Start resolves router paths from the configured src directory.
		tanstackStart({ router: { routesDirectory: "./app", routeFileIgnorePattern: "\\.test\\." } }),
		nitro({ preset: "bun" }),
		react(),
	],
	resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
