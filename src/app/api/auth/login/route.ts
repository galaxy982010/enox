import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db/store";
import { setServerSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    await setServerSessionCookie(user);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Unable to process login request." },
      { status: 500 }
    );
  }
}
