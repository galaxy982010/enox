import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/db/store";
import { setServerSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.fullName === "string" ? body.fullName : "";
    const newsletterConsent = Boolean(body.newsletterConsent);

    const result = registerCustomer({
      email,
      password,
      fullName,
      newsletterConsent,
    });

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || "Registration failed." },
        { status: 400 }
      );
    }

    await setServerSessionCookie(result.user);
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to complete registration." },
      { status: 500 }
    );
  }
}
