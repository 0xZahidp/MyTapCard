import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

import { auth } from "@/lib/auth"; // ✅ Auth.js session
import { getUserFromToken } from "@/lib/auth-legacy"; // ✅ legacy JWT fallback

export const runtime = "nodejs";

async function getAuthedUserId(): Promise<string | null> {
  // 1) Prefer Auth.js / NextAuth session (Google/Facebook)
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;

  if (sessionEmail) {
    await dbConnect();
    const user = await User.findOne({ email: sessionEmail }).select("_id").lean();
    return user ? String(user._id) : null;
  }

  // 2) Legacy JWT cookie "token"
  const legacy = await getUserFromToken();
  return legacy?.userId ? String(legacy.userId) : null;
}

export async function POST(req: Request) {
  await dbConnect();

  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing avatar file" }, { status: 400 });
  }

  // 2MB max
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max image size is 2MB" }, { status: 400 });
  }

  if (!file.type?.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult: any = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "avatars",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(buffer);
  });

  await User.findByIdAndUpdate(userId, {
    avatar: uploadResult.secure_url,
  });

  return NextResponse.json({
    success: true,
    avatar: uploadResult.secure_url,
  });
}
