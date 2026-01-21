import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import Link from "@/models/Link";
import Profile from "@/models/Profile";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  // 1) Prefer Auth.js / NextAuth session
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail })
      .select("_id")
      .lean();
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

    const { id, direction } = await req.json();
    if (!id || !["up", "down"].includes(direction)) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    // ✅ ensure link belongs to this profile
    const link = await Link.findOne({ _id: id, profileId: profile._id });
    if (!link) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // ✅ group-aware swap
    const swapWith = await Link.findOne({
      profileId: profile._id,
      groupId: link.groupId ?? null,
      order: direction === "up" ? link.order - 1 : link.order + 1,
    });

    if (!swapWith) return NextResponse.json({ message: "No move" });

    const temp = link.order;
    link.order = swapWith.order;
    swapWith.order = temp;

    await link.save();
    await swapWith.save();

    return NextResponse.json({ message: "Reordered" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
