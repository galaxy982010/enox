import { NextResponse } from "next/server";
import { completePasswordReset, issuePasswordResetToken } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "request";

    if (action === "request") {
      const email = String(body.email || "").trim();
      if (!email) {
        return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
      }
      const res = issuePasswordResetToken(email);
      return NextResponse.json({
        ok: true,
        message: "If an account exists for this email, a verification code has been issued.",
        demoResetCode: process.env.NODE_ENV !== "production" ? res.demoResetCode : undefined,
      });
    }

    if (action === "confirm") {
      const res = completePasswordReset({
        email: String(body.email || ""),
        token: String(body.token || ""),
        newPassword: String(body.newPassword || ""),
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process password reset." }, { status: 500 });
  }
}
