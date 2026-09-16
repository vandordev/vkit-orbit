import type { JobContract } from "./contracts/types";

export function createJobId(contract: JobContract | string, businessId: string, revision: number): string {
	const name = typeof contract === "string" ? contract : contract.name;
	if (!/^\w+(?:\.\w+)*\.v\d+$/.test(name) || name.includes(":")) throw new Error("invalid versioned job name");
	if (!businessId.trim() || businessId.includes(":")) throw new Error("invalid business id");
	if (!Number.isInteger(revision) || revision < 1) throw new Error("invalid revision");
	return `${name.replaceAll(".", ".")}__${businessId}__${revision}`;
}
