import { hashPassword, verifyPassword } from "./password";
import { toSafeUser, type SafeUser } from "./policy";
import { hashSessionToken, issueSession } from "./sessions";

type UserRecord = { id: string; email: string; passwordHash: string; isActive: boolean };
type SessionRecord = { id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt?: Date | null; lastUsedAt?: Date | null };
type AuthDatabase = {
  $transaction<T>(callback: (tx: AuthDatabase) => Promise<T>): Promise<T>;
  user: { findUnique(args: { where: { email?: string; id?: string } }): Promise<UserRecord | null>; create(args: { data: Record<string, unknown> }): Promise<UserRecord> };
  authSession: { create(args: { data: Record<string, unknown> }): Promise<SessionRecord>; findUnique(args: { where: { tokenHash: string } }): Promise<SessionRecord | null>; update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<SessionRecord> };
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function createAuthService(input: { db: AuthDatabase; sessionTtlSeconds: number; now?: () => Date; tokenFactory?: () => string }) {
  const now = input.now ?? (() => new Date());
  const safeSession = async (token: string) => {
    const session = await input.db.authSession.findUnique({ where: { tokenHash: await hashSessionToken(token) } });
    if (!session || session.revokedAt || session.expiresAt <= now()) return null;
    const user = await input.db.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) return null;
    const current = now();
    const shouldRenew = session.expiresAt.getTime() - current.getTime() < input.sessionTtlSeconds * 500;
    await input.db.authSession.update({ where: { id: session.id }, data: { lastUsedAt: current, ...(shouldRenew ? { expiresAt: new Date(current.getTime() + input.sessionTtlSeconds * 1000) } : {}) } });
    return toSafeUser(user);
  };
  return {
    async bootstrapAdmin(email: string, password: string) {
      const normalized = normalizeEmail(email);
      const existing = await input.db.user.findUnique({ where: { email: normalized } });
      if (existing) return { status: "already_exists" as const, user: toSafeUser(existing) };
      const user = await input.db.user.create({ data: { email: normalized, passwordHash: await hashPassword(password), isActive: true } });
      return { status: "created" as const, user: toSafeUser(user) };
    },
    async login(email: string, password: string): Promise<{ token: string; user: SafeUser } | null> {
      const user = await input.db.user.findUnique({ where: { email: normalizeEmail(email) } });
      if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) return null;
      const { token } = await issueSession({ db: input.db, userId: user.id, ttlSeconds: input.sessionTtlSeconds, now: now(), tokenFactory: input.tokenFactory });
      return { token, user: toSafeUser(user) };
    },
    currentUser: safeSession,
    async logout(token: string) {
      const session = await input.db.authSession.findUnique({ where: { tokenHash: await hashSessionToken(token) } });
      if (!session) return false;
      await input.db.authSession.update({ where: { id: session.id }, data: { revokedAt: now() } });
      return true;
    },
  };
}
