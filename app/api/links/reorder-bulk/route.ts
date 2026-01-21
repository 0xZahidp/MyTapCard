import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  const cookieStore = await cookies(); // ✅ FIX
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
  await dbConnect();
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { groupId = null, orderedIds } = await req.json();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

  const ops = orderedIds.map((id: string, idx: number) => ({
    updateOne: {
      filter: { _id: id, profileId: profile._id, groupId },
      update: { $set: { order: idx } },
    },
  }));

  await Link.bulkWrite(ops);
  return NextResponse.json({ ok: true });
}
