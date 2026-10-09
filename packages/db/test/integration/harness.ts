import { PrismaClient } from "@prisma/client";
import { loadTestEnvironment } from "../../src/test-environment";

export async function withPostgres<T>(callback: (db: PrismaClient) => Promise<T>): Promise<T> {
	const existing = process.env.TEST_DATABASE_URL;
	let container: string | undefined;
	const url =
		existing ??
		(await startContainer().then((result) => {
			container = result.container;
			return result.url;
		}));
	loadTestEnvironment({ TEST_DATABASE_URL: url });
	try {
		if (!existing) {
			const migration = Bun.spawnSync(["bunx", "prisma", "migrate", "deploy", "--schema", "packages/db/prisma/schema.prisma"], {
				env: { ...process.env, DATABASE_URL: url },
			});
			if (migration.exitCode !== 0) throw new Error(new TextDecoder().decode(migration.stderr));
		}
		const db = new PrismaClient({ datasourceUrl: url });
		try {
			return await callback(db);
		} finally {
			await db.$disconnect();
		}
	} finally {
		if (container) Bun.spawnSync(["docker", "rm", "-f", container]);
	}
}

async function startContainer(): Promise<{ container: string; url: string }> {
	const started = Bun.spawnSync([
		"docker",
		"run",
		"-d",
		"-P",
		"-e",
		"POSTGRES_PASSWORD=test",
		"-e",
		"POSTGRES_DB=orbit_test",
		"postgres:16-alpine",
	]);
	if (started.exitCode !== 0) throw new Error(new TextDecoder().decode(started.stderr));
	const container = new TextDecoder().decode(started.stdout).trim();
	for (let attempt = 0; attempt < 30; attempt++) {
		const ready = Bun.spawnSync(["docker", "exec", container, "pg_isready", "-U", "postgres", "-d", "orbit_test"]);
		if (ready.exitCode === 0) break;
		await Bun.sleep(500);
	}
	const port = new TextDecoder()
		.decode(Bun.spawnSync(["docker", "port", container, "5432/tcp"]).stdout)
		.trim()
		.split(":")
		.at(-1);
	if (!port) throw new Error("PostgreSQL container did not publish a port");
	return { container, url: `postgresql://postgres:test@127.0.0.1:${port}/orbit_test` };
}
