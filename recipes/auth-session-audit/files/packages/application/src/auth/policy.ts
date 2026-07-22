export type SafeUser = { id: string; email: string; isActive: boolean };

export function toSafeUser(user: { id: string; email: string; isActive: boolean }): SafeUser {
  return { id: user.id, email: user.email, isActive: user.isActive };
}
