import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

function isStrongEnough(password: string) {
  return typeof password === "string" && password.length >= 8;
}
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isStrongEnough(password)) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await dbConnect();

    // ✅ select password to detect OAuth-created accounts
    const existingUser = await User.findOne({ email }).select("+password _id");
    if (existingUser) {
      // If this email exists but has no password, it is likely OAuth user
      const existingPw = (existingUser as any).password as string | undefined;

      if (!existingPw || existingPw.trim().length === 0) {
        return NextResponse.json(
          {
            message:
              "This email is already registered with Google/Facebook. Please login using Google or Facebook.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    await Subscription.create({
      userId: user._id,
      plan: "free",
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR", error);

    // ✅ handle duplicate email race condition (Mongo unique index)
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
