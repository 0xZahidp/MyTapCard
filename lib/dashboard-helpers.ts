export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export async function safeJson<T = any>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isValidPhone(v: string) {
  return /^[+()\-\s0-9]{6,}$/.test(v.trim());
}

export function normalizeUsername(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 30);
}

export type LinkType = "url" | "phone" | "email" | "";

export function normalizeLinkValue(type: Exclude<LinkType, "">, value: string) {
  const v = value.trim();

  if (type === "url") {
    if (!/^https?:\/\//i.test(v)) return `https://${v}`;
    return v;
  }

  if (type === "email") return v.toLowerCase();

  return v; // phone
}
