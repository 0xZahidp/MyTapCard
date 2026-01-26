import { auth } from "@/lib/auth";
import { getUserFromToken } from "@/lib/auth-legacy";

export async function getAuthedEmail() {
  // NextAuth session
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) return String(sessionEmail).toLowerCase();

  // Legacy JWT cookie
  const legacy = await getUserFromToken();
  if (legacy?.email) return String(legacy.email).toLowerCase();

  return null;
}
