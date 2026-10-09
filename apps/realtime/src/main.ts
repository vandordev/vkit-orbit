import { getRealtimeConfig } from "@repo/config/server";

import { createTicketAuthenticator } from "./auth";
import { createRealtimeServer } from "./server";
import { log } from "./logger";

if (import.meta.main) {
const config = getRealtimeConfig();
const runtime = createRealtimeServer({
	publishApiKey: config.realtime.publishApiKey,
	authenticate: createTicketAuthenticator(config.realtime.ticketSecret),
	authorizeWorkspace: async () => false,
	corsOrigin: config.realtime.corsOrigin,
});

await runtime.listen(config.realtime.port, config.realtime.host);
log("info", { service: "realtime", environment: config.app.environment }, "realtime started");

async function shutdown() {
	await runtime.close();
	process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
}
