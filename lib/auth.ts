import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface AuthUser extends JwtPayload {
  userId: string;
  email: string;
}

export async function getUserFromToken(): Promise<AuthUser | null> {
  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    console.error("Invalid JWT:", error);
    return null;
  }
}
