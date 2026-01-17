import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import Subscription from "@/models/Subscription"; // ✅ add this

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { type, label, value } = await req.json();

    if (!type || !label || !value) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const profile = await Profile.findOne({ userId: decoded.userId });

    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    // ✅ PART 3 — enforce link limit (Free plan max 3)
    const subscription = await Subscription.findOne({
      userId: decoded.userId,
    });

    const linkCount = await Link.countDocuments({
      profileId: profile._id,
    });

    if (subscription?.plan === "free" && linkCount >= 3) {
      return NextResponse.json(
        {
          message: "Free plan allows only 3 links. Upgrade to Pro to add more.",
        },
        { status: 403 }
      );
    }

    const lastLink = await Link.findOne({ profileId: profile._id })
      .sort({ order: -1 })
      .lean();

    const nextOrder =
      typeof lastLink?.order === "number" ? lastLink.order + 1 : 0;

    const link = await Link.create({
      profileId: profile._id,
      type,
      label,
      value,
      order: nextOrder,
      isActive: true,
    });

    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json([], { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    await dbConnect();

    const profile = await Profile.findOne({ userId: decoded.userId });

    if (!profile) return NextResponse.json([]);

    const links = await Link.find({ profileId: profile._id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(links);
  } catch {
    return NextResponse.json([]);
  }
}
