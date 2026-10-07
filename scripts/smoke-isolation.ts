export function assertSmokeIsolation(environment: Record<string, string | undefined> = process.env): string {
	const project = environment.COMPOSE_PROJECT_NAME;
	if (environment.ORBIT_SMOKE_DISPOSABLE !== "1" || !project || !/^orbit-smoke-[a-z0-9]+$/.test(project)) {
		throw new Error("Destructive smoke requires an explicitly disposable orbit-smoke-<id> Compose project");
	}
	return project;
}
