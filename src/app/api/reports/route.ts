import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { createCopyrightReport, createSupportRequest } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type || "copyright");

    if (type === "support") {
      const user = await getServerSessionUser();
      if (!user) {
        return NextResponse.json(
          { error: "Please sign in to submit an account support request." },
          { status: 401 }
        );
      }
      const res = createSupportRequest({
        userId: user.id,
        subject: String(body.subject || ""),
        category: String(body.category || "Order & Download Support"),
        message: String(body.message || ""),
      });
      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, request: res.request }, { status: 201 });
    }

    const res = createCopyrightReport({
      bookId: String(body.bookId || ""),
      reporterName: String(body.reporterName || ""),
      reporterEmail: String(body.reporterEmail || ""),
      reason: String(body.reason || "Copyright or IP Concern"),
      details: String(body.details || ""),
    });
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, report: res.report }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit report right now." },
      { status: 500 }
    );
  }
}
