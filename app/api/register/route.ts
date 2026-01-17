import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ store created user in a variable
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // ✅ auto-create free subscription
    await Subscription.create({
      userId: user._id,
      plan: "free",
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR 👉", error);

    return NextResponse.json(
      {
        message: "Something went wrong",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
