export function loadTestEnvironment(environment: Record<string, string | undefined> = process.env): Record<string, string> {
	const url = environment.TEST_DATABASE_URL;
	if (!url) throw new Error("TEST_DATABASE_URL is required; development configuration is never a fallback");
	const parsed = new URL(url);
	if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !decodeURIComponent(parsed.pathname.slice(1)).endsWith("_test")) {
		throw new Error("Database tests require a disposable PostgreSQL database ending in _test");
	}
	return {
		...Object.fromEntries(Object.entries(environment).filter((entry): entry is [string, string] => entry[1] !== undefined)),
		NODE_ENV: "test",
		DATABASE_URL: url,
		TEST_DATABASE_URL: url,
	};
}
