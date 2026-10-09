import { PrismaClient } from "@prisma/client";
import { getDatabaseConfig, type DatabaseConfig } from "@repo/config/server";

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

export function createDatabaseClient(input: DatabaseConfig): DatabaseClient {
	return new PrismaClient({ datasourceUrl: input.url, log: input.environment === "development" ? ["warn", "error"] : ["error"] });
}
let client: DatabaseClient | undefined;
export function getPrisma(): DatabaseClient {
	if (client) return client;
	const config = getDatabaseConfig();
	client = globalForPrisma.prisma ?? createDatabaseClient(config);
	if (config.environment !== "production") globalForPrisma.prisma = client;
	return client;
}

export type DatabaseClient = PrismaClient;
