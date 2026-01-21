import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import LinkGroup from "@/models/LinkGroup";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  // 1) Try NextAuth session (Google/Facebook)
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  // 2) Fallback to legacy JWT cookie (✅ Next 15/16 cookies() is async)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | any;
    return String(decoded?.userId || decoded?.id || decoded?.sub || "");
  } catch {
    return null;
  }
}

// ✅ This is the route your UI is calling: PATCH /api/link-groups/:id/toggle
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const group = await LinkGroup.findOne({ _id: id, profileId: profile._id });
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    group.isActive = !group.isActive;
    await group.save();

    return NextResponse.json({ ok: true, isActive: group.isActive }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to toggle group" }, { status: 500 });
  }
}
