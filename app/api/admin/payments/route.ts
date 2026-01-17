import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import PaymentRequest from "@/models/PaymentRequest";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function requireAdmin() {
  const cookieStore = await cookies(); // ✅ IMPORTANT for Next 16.1.x
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
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

  await dbConnect();

  const adminUser = await User.findById(decoded.userId).lean();

  if (!adminUser || adminUser.email !== process.env.ADMIN_EMAIL) {
    return {
      ok: false as const,
      res: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, adminUser };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  try {
    const payments = await PaymentRequest.find({ status: "pending" })
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(payments);
  } catch (e: any) {
    return NextResponse.json(
      { message: "Error fetching payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(); // ✅ protect approval too
  if (!auth.ok) return auth.res;

  try {
    const { paymentId, userId } = await req.json();

    if (!paymentId || !userId) {
      return NextResponse.json(
        { message: "paymentId and userId are required" },
        { status: 400 }
      );
    }

    await dbConnect();

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
