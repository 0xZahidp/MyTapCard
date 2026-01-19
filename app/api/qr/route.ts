import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import User from "@/models/User";

import { auth } from "@/lib/auth";

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

export async function GET() {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profile = await Profile.findOne({ userId }).lean();

    if (!profile?.username) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL;
    if (!base) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_BASE_URL is missing" },
        { status: 500 }
      );
    }

    const profileUrl = `${base.replace(/\/$/, "")}/${profile.username}`;
    const qr = await QRCode.toDataURL(profileUrl, { width: 300, margin: 2 });

    return NextResponse.json({ qr });
  } catch {
    return NextResponse.json(
      { message: "Failed to generate QR" },
      { status: 500 }
    );
  }
}
