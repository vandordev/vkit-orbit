export type PageInput = { size: number; after?: string; before?: string };
export type WorkspaceScope = { workspaceId: string; principalId: string };

export function pageInput(input: PageInput): PageInput {
	if (!Number.isInteger(input.size) || input.size < 1 || input.size > 100) throw new Error("page size must be 1..100");
	if (input.after && input.before) throw new Error("after and before are mutually exclusive");
	return input;
}
