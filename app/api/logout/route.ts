import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  const expire = new Date(0);

  // 1) ✅ Clear legacy JWT cookie
  res.cookies.set("token", "", {
    httpOnly: true,
    expires: expire,
    path: "/",
    sameSite: "lax",
  });

  // 2) ✅ Clear Auth.js / NextAuth v5 cookies (what your middleware checks)
  res.cookies.set("authjs.session-token", "", { expires: expire, path: "/" });
  res.cookies.set("__Secure-authjs.session-token", "", {
    expires: expire,
    path: "/",
  });

  res.cookies.set("authjs.csrf-token", "", { expires: expire, path: "/" });
  res.cookies.set("__Host-authjs.csrf-token", "", { expires: expire, path: "/" });

  res.cookies.set("authjs.callback-url", "", { expires: expire, path: "/" });
  res.cookies.set("__Secure-authjs.callback-url", "", { expires: expire, path: "/" });

  // 3) ✅ Also clear older NextAuth v4 cookie names (safe to include)
  res.cookies.set("next-auth.session-token", "", { expires: expire, path: "/" });
  res.cookies.set("__Secure-next-auth.session-token", "", {
    expires: expire,
    path: "/",
  });
  res.cookies.set("next-auth.csrf-token", "", { expires: expire, path: "/" });
  res.cookies.set("__Host-next-auth.csrf-token", "", { expires: expire, path: "/" });
  res.cookies.set("next-auth.callback-url", "", { expires: expire, path: "/" });

  return res;
}
