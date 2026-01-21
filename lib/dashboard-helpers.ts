// lib/dashboard-helpers.ts

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

/**
 * ✅ Returns your site's base URL (works on Vercel + locally).
 * - Client: uses window.location.origin
 * - Server/build: uses env vars (recommended to set NEXT_PUBLIC_SITE_URL)
 */
export function getBaseUrl(): string {
  // Client-side
  if (typeof window !== "undefined") return window.location.origin;

  // Server/build-time fallbacks
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return envUrl || "http://localhost:3000";
}
