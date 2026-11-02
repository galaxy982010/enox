import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = subscribeToNewsletter({
      email: String(body.email || ""),
      consentGiven: Boolean(body.consentGiven),
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to process newsletter subscription." },
      { status: 400 }
    );
  }
}
