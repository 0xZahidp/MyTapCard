import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

import { auth } from "@/lib/auth";
import { normalizeAndValidateLink } from "@/lib/validators/link";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;

async function getAuthedUserId(): Promise<string | null> {
  // 1) Prefer Auth.js / NextAuth session (Google/Facebook)
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

    const body = await req.json();
    const { type, label, value } = body ?? {};

    // Basic presence check
    if (!type || !label || !value) {
      return NextResponse.json(
        { message: "type, label, and value are required" },
        { status: 400 }
      );
    }

    // ✅ Validate + normalize (URL/email/phone)
    let normalized;
    try {
      normalized = normalizeAndValidateLink({ type, label, value });
    } catch (e: any) {
      return NextResponse.json(
        { message: e?.message || "Invalid link input" },
        { status: 400 }
      );
    }

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    // ✅ Free plan max 3 links
    const subscription = await Subscription.findOne({ userId }).lean();
    const plan = (subscription?.plan ?? "free") as string;

    const linkCount = await Link.countDocuments({ profileId: profile._id });
    if (plan === "free" && linkCount >= 3) {
      return NextResponse.json(
        {
          message: "Free plan allows only 3 links. Upgrade to Pro to add more.",
        },
        { status: 403 }
      );
    }

    // next order
    const lastLink = await Link.findOne({ profileId: profile._id })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const nextOrder =
      typeof lastLink?.order === "number" ? lastLink.order + 1 : 0;

    const link = await Link.create({
      profileId: profile._id,
      type: normalized.type,
      label: normalized.label,
      value: normalized.value,
      order: nextOrder,
      isActive: true,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json([], { status: 401 });
    }

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) return NextResponse.json([]);

    const links = await Link.find({ profileId: profile._id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(links);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
