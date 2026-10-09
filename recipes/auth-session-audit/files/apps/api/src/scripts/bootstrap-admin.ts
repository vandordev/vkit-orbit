
export type BootstrapService = { bootstrapAdmin(email: string, password: string): Promise<{ status: "created" | "already_exists" }> };

// Consumer-owned typed extension; this opt-in recipe does not add active YAML keys.
export function loadBootstrapInput(config: { bootstrapEmail?: string; bootstrapPassword?: string }) {
	if (!config.bootstrapEmail || !config.bootstrapPassword) throw new Error("Bootstrap email and password are required");
	return { email: config.bootstrapEmail, password: config.bootstrapPassword };
}

export async function bootstrapAdmin(service: BootstrapService, input: { email: string; password: string }) {
	return service.bootstrapAdmin(input.email, input.password);
}
