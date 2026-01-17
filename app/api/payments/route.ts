import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import PaymentRequest from "@/models/PaymentRequest";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { method, transactionId, amount } = await req.json();

    if (!method || !transactionId || !amount) {
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 }
      );
    }

    await dbConnect();

    await PaymentRequest.create({
      userId: decoded.userId,
      method,
      transactionId,
      amount,
    });

    return NextResponse.json(
      { message: "Payment request submitted" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to submit payment" },
      { status: 500 }
    );
  }
}
