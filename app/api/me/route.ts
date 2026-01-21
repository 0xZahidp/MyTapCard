import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Subscription from "@/models/Subscription";

// Legacy JWT (server-only)
import { getUserFromToken } from "@/lib/auth-legacy";

// NextAuth session (server-only)
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

function computeIsPro(sub: any) {
  if (!sub) return { plan: "free", isPro: false };
  if (sub.plan !== "pro") return { plan: sub.plan || "free", isPro: false };
  if (!sub.expiresAt) return { plan: "pro", isPro: true };
  return { plan: "pro", isPro: new Date(sub.expiresAt).getTime() > Date.now() };
}

export async function GET() {
  try {
    await dbConnect();

    // helper to build response
    const build = async (userId: string, userDoc: any, source: "oauth" | "legacy") => {
      const profile = await Profile.findOne({ userId }).select("displayName username bio").lean();
      const sub = await Subscription.findOne({ userId }).select("plan expiresAt").lean();
      const { plan, isPro } = computeIsPro(sub);

      return NextResponse.json({
        user: {
          id: String(userDoc._id),
          name: userDoc.name,
          email: userDoc.email,
          avatar: userDoc.avatar || "",
          plan,
          isPro,
        },
        profile: profile || null,
        subscription: sub || { plan: "free", expiresAt: null },
        source,
      });
    };

    // 1) Try NextAuth session first
    const session = await auth();
    const sessionEmail =
      (session?.user as any)?.email || (session?.user as any)?.emailAddress;

    if (sessionEmail) {
      let userDoc = await User.findOne({ email: sessionEmail })
        .select("name email avatar")
        .lean();

      if (!userDoc) {
        const created = await User.create({
          name: (session?.user as any)?.name || "User",
          email: sessionEmail,
          avatar: (session?.user as any)?.image || "",
          password: "",
        });
        userDoc = created.toObject();

        // optional: ensure subscription row exists
        await Subscription.findOneAndUpdate(
          { userId: created._id },
          { $setOnInsert: { plan: "free", expiresAt: null } },
          { upsert: true, new: true }
        );
      } else {
        // optional: ensure subscription row exists for old users
        await Subscription.findOneAndUpdate(
          { userId: userDoc._id },
          { $setOnInsert: { plan: "free", expiresAt: null } },
          { upsert: true, new: true }
        );
      }

      return build(String(userDoc._id), userDoc, "oauth");
    }

    // 2) Fallback to legacy JWT cookie
    const authUser = await getUserFromToken();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await User.findById(authUser.userId)
      .select("name email avatar")
      .lean();

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // optional: ensure subscription row exists
    await Subscription.findOneAndUpdate(
      { userId: userDoc._id },
      { $setOnInsert: { plan: "free", expiresAt: null } },
      { upsert: true, new: true }
    );

    return build(String(userDoc._id), userDoc, "legacy");
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
