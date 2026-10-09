import { getPrisma, type DatabaseTransaction } from "@repo/db";
export const transaction = <T>(work: (transaction: DatabaseTransaction) => Promise<T>): Promise<T> => getPrisma().$transaction(work);
