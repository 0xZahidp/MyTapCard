// lib/next-url.ts
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) return fallback;

  const n = String(next).trim();

  // Only allow internal paths
  if (!n.startsWith("/")) return fallback;

  // Block protocol-like paths: //evil.com
  if (n.startsWith("//")) return fallback;

  // Optional: block admin redirects if you want
  // if (n.startsWith("/admin")) return fallback;

  return n;
}
