import { prisma } from "@repo/database";
export const transaction = <T>(work: Parameters<typeof prisma.$transaction>[0]) => prisma.$transaction(work as never) as Promise<T>;
