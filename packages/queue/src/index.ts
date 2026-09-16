export type QueueName = "documents" | "webhooks" | "notifications";

export function deterministicJobId(contract: string, businessId: string, revision: number): string {
	if (!contract || !businessId || !Number.isInteger(revision) || revision < 1) throw new Error("invalid job identity");
	return `${contract.replaceAll(":", ".")}__${businessId.replaceAll(":", "_")}__${revision}`;
}
