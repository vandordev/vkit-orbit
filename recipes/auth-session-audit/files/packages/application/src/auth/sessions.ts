export type SessionWriter = {
  authSession: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
};

export async function hashSessionToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function issueSession(input: {
  db: SessionWriter;
  userId: string;
  ttlSeconds: number;
  now?: Date;
  tokenFactory?: () => string;
}) {
  const token = input.tokenFactory?.() ?? crypto.randomUUID();
  const now = input.now ?? new Date();
  const tokenHash = await hashSessionToken(token);
  const session = await input.db.authSession.create({ data: {
    userId: input.userId,
    tokenHash,
    expiresAt: new Date(now.getTime() + input.ttlSeconds * 1000),
    lastUsedAt: now,
  } });
  return { token, session };
}
