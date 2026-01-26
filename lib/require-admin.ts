import { NextResponse } from "next/server";
import { getAuthedEmail } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";

export async function requireAdmin() {
  const email = await getAuthedEmail();

  if (!email) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminEmail(email)) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, adminEmail: email };
}
