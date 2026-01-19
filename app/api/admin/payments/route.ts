import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import PaymentRequest from "@/models/PaymentRequest";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

// ✅ NextAuth/Auth.js server helper
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function requireAdmin() {
  if (!ADMIN_EMAIL) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { message: "ADMIN_EMAIL is missing" },
        { status: 500 }
      ),
    };
  }

  await dbConnect();

  // 1) ✅ Prefer NextAuth/Auth.js session (Google/Facebook)
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    // admin rule = email matches ADMIN_EMAIL
    if (sessionEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return {
        ok: false as const,
        res: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
      };
    }

    // load user (optional, but keeps return shape consistent)
    const adminUser = await User.findOne({ email: sessionEmail }).lean();
    return { ok: true as const, adminUser };
  }

  // 2) Legacy fallback: JWT cookie "token"
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!JWT_SECRET) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "JWT_SECRET is missing" }, { status: 500 }),
    };
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Invalid token" }, { status: 401 }),
    };
  }

  const legacyUser = await User.findById(decoded.userId).lean();

  if (!legacyUser || legacyUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, adminUser: legacyUser };
}

export async function GET() {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  try {
    const payments = await PaymentRequest.find({ status: "pending" })
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(payments);
  } catch {
    return NextResponse.json(
      { message: "Error fetching payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  try {
    const { paymentId, userId } = await req.json();

    if (!paymentId || !userId) {
      return NextResponse.json(
        { message: "paymentId and userId are required" },
        { status: 400 }
      );
    }

    await PaymentRequest.findByIdAndUpdate(paymentId, { status: "approved" });

    await Subscription.findOneAndUpdate(
      { userId },
      { plan: "pro" },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "User upgraded to Pro" });
  } catch {
    return NextResponse.json({ message: "Approval failed" }, { status: 500 });
  }
}
