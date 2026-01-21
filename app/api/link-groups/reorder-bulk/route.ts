import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import LinkGroup from "@/models/LinkGroup";

export const runtime = "nodejs";

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthedUserId(): Promise<string | null> {
  if (!JWT_SECRET) return null;

  // ✅ Next 15/16: cookies() is async
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;

    // Support a few common shapes
    if (typeof decoded === "string") return decoded;
    const anyDecoded = decoded as any;
    return anyDecoded.userId || anyDecoded.id || anyDecoded.sub || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));

  // Accept either { orderedIds: string[] } OR { items: [{id, order}] }
  const orderedIds: string[] =
    Array.isArray(body?.orderedIds) ? body.orderedIds :
    Array.isArray(body?.ids) ? body.ids :
    Array.isArray(body?.items) ? body.items.map((x: any) => x?.id).filter(Boolean) :
    [];

  if (!orderedIds.length) {
    return NextResponse.json({ message: "No ids provided" }, { status: 400 });
  }

  await dbConnect();

  // If your groups are tied to a profile, scope reorder to that profile:
  const profile = await Profile.findOne({ userId }).select("_id").lean();
  if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, profileId: profile._id },
      update: { $set: { order: index } },
    },
  }));

  await LinkGroup.bulkWrite(ops, { ordered: false });

  return NextResponse.json({ ok: true });
}
