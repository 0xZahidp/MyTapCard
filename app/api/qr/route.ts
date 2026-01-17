import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function GET(req: Request) {
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

    await dbConnect();

    const profile = await Profile.findOne({ userId: decoded.userId });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${profile.username}`;

    const qr = await QRCode.toDataURL(profileUrl, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({ qr });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to generate QR" },
      { status: 500 }
    );
  }
}
