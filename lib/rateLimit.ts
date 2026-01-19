type Entry = { count: number; resetAt: number };

const memory = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memory.get(key);

  if (!entry || now > entry.resetAt) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) return { ok: false };

  entry.count += 1;
  memory.set(key, entry);
  return { ok: true };
}
