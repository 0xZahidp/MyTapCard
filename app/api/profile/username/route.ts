import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET;

function norm(u: string) {
  return String(u || "").trim().toLowerCase().replace(/\s+/g, "");
}

async function getAuthedUserId(): Promise<string | null> {
  const session = await auth();
  const sessionEmail = (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

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

export async function GET(req: Request) {
  await dbConnect();

  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const username = norm(searchParams.get("username") || "");

  if (!username) return NextResponse.json({ message: "Missing username" }, { status: 400 });

  // allow keeping your current username
  const mine = await Profile.findOne({ userId }).select("username").lean();
  if (mine?.username && mine.username === username) {
    return NextResponse.json({ available: true, mine: true }, { status: 200 });
  }

  const taken = await Profile.findOne({ username }).select("_id").lean();
  return NextResponse.json({ available: !taken }, { status: 200 });
}
