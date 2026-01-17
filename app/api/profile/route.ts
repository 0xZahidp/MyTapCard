import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import dbConnect from "@/lib/mongodb";
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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const { displayName, bio, username } = await req.json();

    if (!displayName || !username) {
      return NextResponse.json(
        { message: "Display name and username are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingProfile = await Profile.findOne({
      $or: [{ userId: decoded.userId }, { username }],
    });

    if (existingProfile) {
      return NextResponse.json(
        { message: "Profile already exists or username taken" },
        { status: 400 }
      );
    }

    const profile = await Profile.create({
      userId: decoded.userId,
      displayName,
      bio,
      username,
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
