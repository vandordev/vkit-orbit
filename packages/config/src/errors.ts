export type Diagnostic = { filePath: string; runtime: string };

export function configError(diagnostic: Diagnostic, path: readonly PropertyKey[], reason: string): Error {
	return new Error(`Configuration ${diagnostic.filePath} [${diagnostic.runtime}] ${path.map(String).join(".") || "document"}: ${reason}`);
}
