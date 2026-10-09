import { relative } from "node:path";
import { globSync } from "tinyglobby";

export function discoverStories(root: string, configDirectory: string): string[] {
	return globSync("**/*.stories.tsx", {
		cwd: root,
		absolute: true,
		dot: true,
		ignore: [
			"**/node_modules/**",
			"**/.git/**",
			"**/storybook-static/**",
			"**/dist/**",
			"**/.output/**",
			"**/.vite/**",
			"**/.turbo/**",
			"**/coverage/**",
		],
	})
		.map((file) => {
			const path = relative(configDirectory, file).replaceAll("\\", "/");
			return path.startsWith(".") ? path : `./${path}`;
		})
		.sort();
}
