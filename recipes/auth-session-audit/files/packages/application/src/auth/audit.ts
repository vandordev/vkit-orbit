const sensitiveKey = /password|hash|token|cookie|authorization/i;

export function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey.test(key)).map(([key, nested]) => [key, redactAuditValue(nested)]));
  }
  return value;
}

export function createAuditRecord(input: { action: string; userId?: string; payload: unknown }) {
  return { action: input.action, userId: input.userId, payload: redactAuditValue(input.payload) };
}
