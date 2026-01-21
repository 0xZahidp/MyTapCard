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
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  const cookieStore = await cookies(); // ✅ await
  const token = cookieStore.get("token")?.value;
  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | any;
    return String(decoded?.userId || decoded?.id || decoded?.sub || "");
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) return NextResponse.json([], { status: 200 });

    const groups = await LinkGroup.find({ profileId: profile._id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(groups, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const name = (body?.name ?? "").toString().trim();
    if (!name) return NextResponse.json({ message: "Group name required" }, { status: 400 });

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const last = await LinkGroup.findOne({ profileId: profile._id })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const nextOrder = typeof last?.order === "number" ? last.order + 1 : 0;

    const group = await LinkGroup.create({
      profileId: profile._id,
      name,
      order: nextOrder,
      isActive: true,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to add group" }, { status: 500 });
  }
}
