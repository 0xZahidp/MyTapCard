import crypto from "crypto";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function validatePassword(pw: string) {
  // Keep it simple for now — can be stronger later
  return typeof pw === "string" && pw.length >= 8;
}
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));

  if (!token || typeof token !== "string") {
    return NextResponse.json({ message: "Invalid token." }, { status: 400 });
  }
  if (!validatePassword(password)) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  await dbConnect();

  const tokenHash = sha256(token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Token is invalid or expired." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;

  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;

  await user.save();

  return NextResponse.json(
    { message: "Password updated successfully." },
    { status: 200 }
  );
}
