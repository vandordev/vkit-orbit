import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const forbidden =
	/@repo\/(?:application|db|storage|queue)|@repo\/config(?!\/public(?:["'\s;]|$))|@prisma\/|\b(?:bullmq|ioredis|node:(?:fs|net|tls|child_process))\b|\b(?:DATABASE_URL|REDIS_URL|WEBHOOK_SECRET_ENCRYPTION_KEY|S3_SECRET_ACCESS_KEY|WORKER_NOTIFICATION_API_KEY|REALTIME_PUBLISH_API_KEY|REALTIME_TICKET_SECRET)\b\s*[:=]|-----BEGIN [A-Z ]+PRIVATE KEY-----/;
function files(root: string): string[] {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? files(join(root, entry.name))
			: /\.(?:js|mjs|cjs|css|json|html|map)$/.test(entry.name)
				? [join(root, entry.name)]
				: [],
	);
}
export function checkPublicBundles(directories: readonly string[]): string[] {
	if (!directories.length) return ["No browser output directories configured"];
	return directories.flatMap((root) => {
		if (!existsSync(root)) return [`${root}: browser output is missing`];
		const assets = files(root);
		if (!assets.length) return [`${root}: browser output is empty`];
		return assets
			.filter((file) => forbidden.test(readFileSync(file, "utf8")))
			.map((file) => `${root}/${relative(root, file)}: server-only or credential marker present`);
	});
}
if (import.meta.main) {
	const violations = checkPublicBundles(process.argv.length > 2 ? process.argv.slice(2) : ["apps/web/.output/public"]);
	if (violations.length) {
		console.error(violations.join("\n"));
		process.exitCode = 1;
	} else console.log("Public browser bundle checks passed.");
}
