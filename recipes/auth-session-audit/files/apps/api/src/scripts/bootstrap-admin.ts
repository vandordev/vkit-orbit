import { loadConfig } from "@repo/config";

export type BootstrapService = { bootstrapAdmin(email: string, password: string): Promise<{ status: "created" | "already_exists" }> };

export function loadBootstrapInput(environment: Record<string, string | undefined>, configDirectory: string) {
  const config = loadConfig({ configDirectory, modules: ["base", "auth"], environment }) as Record<string, string | undefined>;
  if (!config.AUTH_BOOTSTRAP_EMAIL || !config.AUTH_BOOTSTRAP_PASSWORD) throw new Error("AUTH_BOOTSTRAP_EMAIL and AUTH_BOOTSTRAP_PASSWORD are required");
  return { email: config.AUTH_BOOTSTRAP_EMAIL, password: config.AUTH_BOOTSTRAP_PASSWORD };
}

export async function bootstrapAdmin(service: BootstrapService, input: { email: string; password: string }) {
  return service.bootstrapAdmin(input.email, input.password);
}
