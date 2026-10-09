export { prisma } from "./client.js";
export type { DatabaseClient } from "./client.js";
export { Prisma } from "@prisma/client";
export type { PrismaClient } from "@prisma/client";
export type DatabaseTransaction = import("@prisma/client").Prisma.TransactionClient;
export type DatabaseConnection = import("@prisma/client").PrismaClient | DatabaseTransaction;
