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
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

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

async function getProfileIdFromUserId(userId: string): Promise<string | null> {
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  return profile ? String(profile._id) : null;
}

// ✅ normalize legacy docs -> new shape when responding
function normalizeFinancialDoc(doc: any) {
  const t = String(doc?.type || "").toLowerCase();

  // already new
  if (t === "mfs" || t === "bank") return doc;

  // legacy: { type:"bkash", label, value }
  const provider = doc?.provider || doc?.type || "other";
  const label = doc?.label || "";
  const value = doc?.value || "";

  return {
    ...doc,
    type: "mfs",
    provider,
    fields: doc?.fields || {
      accountName: label,
      number: value,
    },
  };
}

export async function GET() {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profileId = await getProfileIdFromUserId(userId);
    if (!profileId) return NextResponse.json([], { status: 200 });

    const items = await Financial.find({ profileId }).sort({ order: 1 }).lean();
    return NextResponse.json(items.map(normalizeFinancialDoc), { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profileId = await getProfileIdFromUserId(userId);
    if (!profileId) {
      return NextResponse.json({ message: "Profile not found. Create profile first." }, { status: 404 });
    }

    const body = await req.json();

    // ✅ Accept NEW format
    let type = String(body.type || "").toLowerCase();
    let provider = String(body.provider || "").trim();
    let fields = (body.fields && typeof body.fields === "object") ? body.fields : {};

    // ✅ Accept OLD format and convert to NEW
    // old: { type:"bkash", label:"bKash Personal", value:"016..." }
    if (type && type !== "mfs" && type !== "bank") {
      provider = provider || type;
      type = "mfs";
      fields = {
        accountName: String(body.label || "").trim(),
        number: String(body.value || "").trim(),
      };
    }

    if (type !== "mfs" && type !== "bank") {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    // basic validation
    if (type === "mfs") {
      const number = String(fields?.number || "").trim();
      if (!number) return NextResponse.json({ message: "MFS number is required" }, { status: 400 });
      if (!provider) provider = "other";
    } else {
      const bankName = String(fields?.bankName || "").trim();
      const holderName = String(fields?.holderName || "").trim();
      const accountNo = String(fields?.accountNo || "").trim();
      if (!bankName || !holderName || !accountNo) {
        return NextResponse.json({ message: "bankName, holderName, accountNo are required" }, { status: 400 });
      }
    }

    const last = await Financial.findOne({ profileId }).sort({ order: -1 }).select("order").lean();
    const nextOrder = typeof last?.order === "number" ? last.order + 1 : 0;

    const created = await Financial.create({
      profileId,
      type,
      provider,
      fields,
      order: nextOrder,
      isActive: true,
    });

    return NextResponse.json(normalizeFinancialDoc(created.toObject()), { status: 201 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profileId = await getProfileIdFromUserId(userId);
    if (!profileId) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const { id, type, provider, fields, isActive } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const item = await Financial.findOne({ _id: id, profileId }).lean();
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const update: any = {};
    if (type != null) update.type = String(type).toLowerCase(); // "mfs" | "bank"
    if (provider != null) update.provider = String(provider || "").trim();
    if (fields != null && typeof fields === "object") update.fields = fields;
    if (isActive != null) update.isActive = !!isActive;

    const updated = await Financial.findByIdAndUpdate(id, update, { new: true }).lean();
    return NextResponse.json(normalizeFinancialDoc(updated), { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const profileId = await getProfileIdFromUserId(userId);
    if (!profileId) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const item = await Financial.findOne({ _id: id, profileId }).lean();
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await Financial.deleteOne({ _id: id, profileId });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
