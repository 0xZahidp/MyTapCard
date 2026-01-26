export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "file is required" }, { status: 400 });
    }

    // Basic checks
    const mime = String(file.type || "");
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files allowed" }, { status: 400 });
    }

    // Optional: 5MB limit
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const maxBytes = 5 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return NextResponse.json({ message: "Max 5MB image size" }, { status: 400 });
    }

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mytapcard/products",
          resource_type: "image",
        },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
