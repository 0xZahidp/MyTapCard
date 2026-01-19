import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;
export const runtime = "nodejs";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Helper: never log secrets
function safeLog(label: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(label, meta ?? "");
  } else {
    console.log(label);
  }
}

export async function POST(req: Request) {
  try {
    safeLog("🔐 LOGIN API HIT");

    const body = await req.json().catch(() => null);

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    safeLog("📩 Login attempt", { email: email || "[missing]" });

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // ✅ must select password because schema has select:false
    const user = await User.findOne({ email }).select("+password");

    // Avoid account enumeration: same message either way
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ NEW: block OAuth-only accounts from password login
    // (happens if user was created by Google/Facebook sign-in)
    if (!user.password || user.password.trim().length === 0) {
      return NextResponse.json(
        {
          message:
            "This account uses Google/Facebook login. Please continue with Google or Facebook.",
        },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    safeLog("✅ Login success", { email });

    return response;
  } catch (error) {
    console.error("🔥 LOGIN ERROR", error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
