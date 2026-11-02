import { NextResponse } from "next/server";
import { submitContactMessage } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = submitContactMessage({
      name: String(body.name || ""),
      email: String(body.email || ""),
      subject: String(body.subject || ""),
      message: String(body.message || ""),
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit contact inquiry." },
      { status: 400 }
    );
  }
}
