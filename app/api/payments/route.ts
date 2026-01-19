import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import PaymentRequest from "@/models/PaymentRequest";
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

export async function POST(req: Request) {
  try {
    await dbConnect();

    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const method = (body?.method ?? "").trim();
    const transactionId = (body?.transactionId ?? "").trim();
    const amountRaw = body?.amount;

    const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);

    if (!method || !transactionId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "method, transactionId, and a valid amount are required" },
        { status: 400 }
      );
    }

    // Optional: prevent duplicate transaction IDs (recommended)
    const existing = await PaymentRequest.findOne({ userId, transactionId })
      .select("_id")
      .lean();

    if (existing) {
      return NextResponse.json(
        { message: "This transactionId was already submitted" },
        { status: 409 }
      );
    }

    await PaymentRequest.create({
      userId,
      method,
      transactionId,
      amount,
      status: "pending", // if you have status in schema; remove if not
    });

    return NextResponse.json(
      { message: "Payment request submitted" },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to submit payment" },
      { status: 500 }
    );
  }
}
