export function isAdminEmail(email: string | null) {
  if (!email) return false;

  const single = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const multi = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (single && email.toLowerCase() === single) return true;
  if (multi.length && multi.includes(email.toLowerCase())) return true;

  return false;
}
