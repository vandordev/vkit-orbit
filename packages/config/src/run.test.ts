import { expect, test } from "bun:test";
import { runConfiguredCommand } from "./run";
test("launcher passes only listener tool settings and disables child env discovery", async () => {
	const result = await runConfiguredCommand({ runtime: "web", environment: { PATH: process.env.PATH, DATABASE_URL: "postgresql://localhost/fixture_test", REALTIME_TICKET_SECRET: "fixture" }, command: [process.execPath, "-e", 'console.log(JSON.stringify({port:process.env.PORT,root:process.env.ORBIT_APPLICATION_ROOT,publisher:process.env.REALTIME_PUBLISH_API_KEY}))'] });
	expect(result.exitCode).toBe(0);
	expect(JSON.parse(result.stdout)).toMatchObject({ port: "4100" });
	expect(JSON.parse(result.stdout)).not.toHaveProperty("publisher");
});
