import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface AuthUser extends JwtPayload {
  userId: string;
  email: string;
}

export async function getUserFromToken(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (
      typeof decoded !== "object" ||
      !("userId" in decoded) ||
      !("email" in decoded)
    ) {
      return null;
    }

    return decoded as AuthUser;
  } catch (error) {
    console.error("Invalid JWT:", error);
    return null;
  }
}
