import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import Financial from "@/models/Financial";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  // 1) Auth.js session
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  // 2) Legacy JWT cookie
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

async function getProfileIdFromUserId(userId: string): Promise<string | null> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  return profile ? String(profile._id) : null;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profileId = await getProfileIdFromUserId(userId);
    if (!profileId) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const { orderedIds } = await req.json(); // ["id1","id2",...]
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { message: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // ✅ Only update items owned by this profile
    const ops = orderedIds.map((id: string, idx: number) =>
      Financial.updateOne({ _id: id, profileId }, { $set: { order: idx } })
    );

    await Promise.all(ops);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
