import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "@/lib/security/crypto";
import { getUserById } from "@/lib/db/store";
import type { UserProfile } from "@/types/enox";

export const SESSION_COOKIE_NAME = "enox_session";

export async function getServerSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;

  // Always verify user and role from the authoritative server database
  const user = getUserById(payload.userId);
  if (!user) return null;
  return user;
}

export async function setServerSessionCookie(user: UserProfile): Promise<void> {
  const token = signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearServerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
