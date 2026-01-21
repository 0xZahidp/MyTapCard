import { NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
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

// ✅ Strict link types that require validation
type StrictLinkType = "url" | "phone" | "email";

// ✅ Type guard so TS knows `t` is StrictLinkType inside the if
function isStrictLinkType(t: string): t is StrictLinkType {
  return t === "url" || t === "phone" || t === "email";
}

// ✅ All types your app accepts (includes strict ones)
const ALLOWED_TYPES = new Set<string>([
  "url",
  "phone",
  "email",
  "sms",
  "social",
  "messaging",
  "video",
  "vcard",
]);

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

  // 2) Legacy JWT cookie "token" (✅ Next 15/16 cookies() is async)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | any;
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

    const body = await req.json().catch(() => ({} as any));
    const {
      type,
      label,
      value,
      groupId = null,
      platform = "",
      meta = {},
      isActive = true,
    } = body ?? {};

    const t = String(type ?? "").trim().toLowerCase();
    const lbl = String(label ?? "").trim();
    const val = String(value ?? "").trim();

    if (!t || !lbl || !val) {
      return NextResponse.json(
        { message: "type, label, and value are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(t)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    const profile = await Profile.findOne({ userId }).select("_id").lean();
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    // ✅ Plan gate (your code checks >= 6, so message should match)
    const subscription = await Subscription.findOne({ userId }).lean();
    const plan = String(subscription?.plan ?? "free");

    const linkCount = await Link.countDocuments({ profileId: profile._id });
    if (plan === "free" && linkCount >= 6) {
      return NextResponse.json(
        { message: "Free plan allows only 6 links. Upgrade to Pro to add more." },
        { status: 403 }
      );
    }

    // ✅ Validate + normalize only for strict types
    let normalized: { type: string; label: string; value: string };

    if (isStrictLinkType(t)) {
      // ✅ This fixes your Vercel build error:
      // `t` is now StrictLinkType, not a plain string
      normalized = normalizeAndValidateLink({ type: t, label: lbl, value: val });
    } else {
      normalized = { type: t, label: lbl, value: val };
    }

    // ✅ Next order INSIDE group
    const lastLink = await Link.findOne({ profileId: profile._id, groupId })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const nextOrder = typeof lastLink?.order === "number" ? lastLink.order + 1 : 0;

    const link = await Link.create({
      profileId: profile._id,
      groupId,
      platform,
      meta,
      type: normalized.type,
      label: normalized.label,
      value: normalized.value,
      order: nextOrder,
      isActive: !!isActive,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: err?.message || "Something went wrong" },
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
      .sort({ groupId: 1, order: 1 })
      .lean();

    return NextResponse.json(links);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
