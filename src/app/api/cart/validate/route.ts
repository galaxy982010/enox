import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { validateCartOnServer } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const user = await getServerSessionUser();
    const body = await request.json();
    const bookIds = Array.isArray(body.bookIds) ? body.bookIds.map(String) : [];
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : null;

    const summary = validateCartOnServer({
      bookIds,
      promoCode,
      userId: user?.id || null,
    });

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "Failed to validate cart." },
      { status: 400 }
    );
  }
}
