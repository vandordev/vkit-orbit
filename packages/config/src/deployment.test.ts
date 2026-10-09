import { expect, test } from "bun:test";

test("containers use the committed YAML configuration and one root environment file", async () => {
	const [compose, webDockerfile, migrateDockerfile, schedulerDockerfile, realtimeDockerfile] = await Promise.all([
		Bun.file("docker-compose.yml").text(),
		Bun.file("Dockerfile.web").text(),
		Bun.file("Dockerfile.migrate").text(),
		Bun.file("Dockerfile.scheduler").text(),
		Bun.file("Dockerfile.realtime").text(),
	]);

	expect(compose).toContain(".env");
	expect(compose).not.toContain(".env.web");
	expect(compose).not.toContain(".env.api");
	for (const dockerfile of [webDockerfile, migrateDockerfile, schedulerDockerfile, realtimeDockerfile]) {
		expect(dockerfile).toContain("/app/config");
	}
	expect(compose).toContain("service_completed_successfully");
	expect(compose).not.toContain("VITE_REALTIME_URL");
	expect(compose).toContain("REALTIME_URL:");
	expect(webDockerfile).not.toContain("ARG DATABASE_URL");
	expect(webDockerfile).not.toContain("ENV DATABASE_URL");
	for (const dockerfile of [webDockerfile, migrateDockerfile, schedulerDockerfile, realtimeDockerfile]) {
		expect(dockerfile).toContain('"--root", "/app"');
		expect(dockerfile).not.toContain("--modules");
	}
});
