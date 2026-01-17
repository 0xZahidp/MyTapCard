import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import Link from "@/models/Link";
import Profile from "@/models/Profile";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ unwrap params properly
    const { id } = await context.params;

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

    // 🔐 extra safety: ensure link belongs to user
    const profile = await Profile.findOne({ userId: decoded.userId });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    const deleted = await Link.findOneAndDelete({
      _id: id,
      profileId: profile._id,
    });

    if (!deleted) {
      return NextResponse.json(
        { message: "Link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Link deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete link" },
      { status: 500 }
    );
  }
}
