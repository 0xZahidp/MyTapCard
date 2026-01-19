import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasAuth =
    // Auth.js / NextAuth v5 cookies
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    // ✅ Legacy login cookie
    req.cookies.has("token");

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  if (!hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "login_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
