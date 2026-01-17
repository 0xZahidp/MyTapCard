import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Link from "@/models/Link";
import Profile from "@/models/Profile";

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

    const { id, direction } = await req.json();
    if (!id || !["up", "down"].includes(direction)) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    await dbConnect();

    const profile = await Profile.findOne({ userId: decoded.userId }).lean();
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    const link = await Link.findOne({ _id: id, profileId: profile._id });
    if (!link) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const swapWith = await Link.findOne({
      profileId: profile._id,
      order: direction === "up" ? link.order - 1 : link.order + 1,
    });

    if (!swapWith) return NextResponse.json({ message: "No move" });

    const temp = link.order;
    link.order = swapWith.order;
    swapWith.order = temp;

    await link.save();
    await swapWith.save();

    return NextResponse.json({ message: "Reordered" });
  } catch {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
