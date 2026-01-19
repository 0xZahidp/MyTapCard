import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Legacy JWT (server-only)
import { getUserFromToken } from "@/lib/auth-legacy";

// NextAuth session (server-only)
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await dbConnect();

    // 1) Try NextAuth session first
    const session = await auth();
    const sessionEmail =
      (session?.user as any)?.email || (session?.user as any)?.emailAddress;

    if (sessionEmail) {
      const existing = await User.findOne({ email: sessionEmail })
        .select("name email avatar")
        .lean();

      if (!existing) {
        const created = await User.create({
          name: (session?.user as any)?.name || "User",
          email: sessionEmail,
          avatar: (session?.user as any)?.image || "",
          password: "",
        });

        return NextResponse.json({
          user: {
            id: String(created._id),
            name: created.name,
            email: created.email,
            avatar: created.avatar || "",
          },
          source: "oauth",
        });
      }

      return NextResponse.json({
        user: {
          id: String(existing._id),
          name: existing.name,
          email: existing.email,
          avatar: existing.avatar || "",
        },
        source: "oauth",
      });
    }

    // 2) Fallback to legacy JWT cookie
    const authUser = await getUserFromToken();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(authUser.userId)
      .select("name email avatar")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
      source: "legacy",
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
