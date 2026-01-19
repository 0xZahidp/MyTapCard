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
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Only validate if fields are being updated
    const { type, label, value, isActive } = body ?? {};

    await dbConnect();

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const update: any = {};
    if (typeof isActive === "boolean") update.isActive = isActive;

    // If user updates type/label/value, validate + normalize
    if (type || label || value) {
      // Fetch existing to merge partial updates safely
      const existing = await Link.findOne({ _id: id, profileId: profile._id }).lean();
      if (!existing) {
        return NextResponse.json({ message: "Link not found" }, { status: 404 });
      }

      const { normalizeAndValidateLink } = await import("@/lib/validators/link");

      const merged = {
        type: (type ?? existing.type) as any,
        label: (label ?? existing.label) as any,
        value: (value ?? existing.value) as any,
      };

      const normalized = normalizeAndValidateLink(merged);
      update.type = normalized.type;
      update.label = normalized.label;
      update.value = normalized.value;
    }

    const saved = await Link.findOneAndUpdate(
      { _id: id, profileId: profile._id },
      { $set: update },
      { new: true }
    ).lean();

    return NextResponse.json(saved, { status: 200 });
  } catch (error: any) {
    const msg = error?.message || "Failed to update link";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ensure link belongs to this user
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const deleted = await Link.findOneAndDelete({
      _id: id,
      profileId: profile._id,
    });

    if (!deleted) {
      return NextResponse.json({ message: "Link not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Link deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete link" },
      { status: 500 }
    );
  }
}
