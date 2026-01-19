import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";

import { auth } from "@/lib/auth"; // ✅ Auth.js session

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  // 1) Prefer Auth.js / NextAuth session (Google/Facebook)
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
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

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { displayName, bio, username } = await req.json();

    if (!displayName || !username) {
      return NextResponse.json(
        { message: "Display name and username are required" },
        { status: 400 }
      );
    }

    // ✅ Username uniqueness check (but allow current user's own profile)
    const taken = await Profile.findOne({
      username,
      userId: { $ne: userId },
    }).lean();

    if (taken) {
      return NextResponse.json(
        { message: "Username taken" },
        { status: 400 }
      );
    }

    // ✅ Create or update profile (upsert)
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { displayName, bio, username },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(profile, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
