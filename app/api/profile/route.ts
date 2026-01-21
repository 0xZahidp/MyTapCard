import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;

function normalizeServerUsername(u: any) {
  // lowercases + trims + removes ALL whitespace
  return String(u || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function isValidUsername(u: string) {
  // allowed: a-z, 0-9, dot, underscore
  return /^[a-z0-9._]+$/.test(u);
}

async function getAuthedUserId(): Promise<string | null> {
  // 1) Prefer Auth.js session (Google/Facebook)
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  // 2) Legacy JWT cookie "token"
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return decoded?.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

async function ensureSubscriptionRow(userId: string) {
  // ensures old users also have a subscription row (defaults to free)
  await Subscription.findOneAndUpdate(
    { userId },
    { $setOnInsert: { plan: "free", expiresAt: null } },
    { upsert: true, new: true }
  ).lean();
}

function computeIsPro(sub: any) {
  if (!sub) return false;
  if (sub.plan !== "pro") return false;
  if (!sub.expiresAt) return true; // lifetime pro
  return new Date(sub.expiresAt).getTime() > Date.now();
}

// ✅ GET /api/profile -> return current user's profile (fixes blank inputs)
export async function GET() {
  await dbConnect();

  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await Profile.findOne({ userId })
    .select("displayName username bio")
    .lean();

  return NextResponse.json(profile || null, { status: 200 });
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // make sure subscription exists
    await ensureSubscriptionRow(userId);

    const body = await req.json();

    const displayName = String(body?.displayName || "").trim();
    const bio = String(body?.bio || "");
    const username = normalizeServerUsername(body?.username);

    if (!displayName || !username) {
      return NextResponse.json(
        { message: "Display name and username are required" },
        { status: 400 }
      );
    }

    // extra safety (normalize removes whitespace, but keep explicit check)
    if (/\s/.test(username)) {
      return NextResponse.json(
        { message: "Username cannot contain spaces" },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: "Username can only contain a-z, 0-9, dot (.), underscore (_)." },
        { status: 400 }
      );
    }

    // ✅ Real Pro gating
    const sub = await Subscription.findOne({ userId })
      .select("plan expiresAt")
      .lean();

    const isProUser = computeIsPro(sub);

    if (!isProUser && username.length < 5) {
      return NextResponse.json(
        { message: "Username must be at least 5 characters for free users." },
        { status: 400 }
      );
    }

    // ✅ Username uniqueness check (allow current user's own profile)
    const taken = await Profile.findOne({
      username,
      userId: { $ne: userId },
    }).lean();

    if (taken) {
      return NextResponse.json({ message: "Username taken" }, { status: 400 });
    }

    // ✅ Create or update profile (upsert)
    const updated = await Profile.findOneAndUpdate(
      { userId },
      { displayName, bio, username },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .select("displayName username bio")
      .lean();

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
