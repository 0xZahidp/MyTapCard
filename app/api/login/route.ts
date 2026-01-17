import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export async function POST(req: Request) {
  try {
    console.log("🔐 LOGIN API HIT");

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { email, password } = body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🔌 Connecting to MongoDB...");
    await dbConnect();
    console.log("✅ MongoDB connected");

    console.log("🔍 Looking for user:", email);
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("🔑 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("✅ Password matched");

    console.log("🪙 Generating JWT...");
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🍪 Setting auth cookie");

    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("🎉 Login successful for:", email);

    return response;
  } catch (error: any) {
    console.error("🔥 LOGIN ERROR 👉", error);

    return NextResponse.json(
      {
        message: "Something went wrong",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
