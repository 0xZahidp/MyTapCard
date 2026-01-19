import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  // Rate limit by IP
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`forgot:${ip}`, 5, 10 * 60 * 1000); // 5 tries / 10 minutes
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { email } = await req.json().catch(() => ({}));
  const safeResponse = {
    message: "If the email exists, we sent a reset link.",
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json(safeResponse, { status: 200 });
  }

  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // ✅ do NOT reveal if user exists
    return NextResponse.json(safeResponse, { status: 200 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/reset-password?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Reset your MyTapCard password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${link}">Click here to reset your password</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return NextResponse.json(safeResponse, { status: 200 });
}
