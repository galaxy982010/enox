import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { authorizeBookDownload } from "@/lib/db/store";
import { createSignedDownloadToken } from "@/lib/security/crypto";
import type { BookFormat } from "@/types/enox";

export async function POST(
  request: Request,
  context: { params: Promise<{ bookId: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to download ebooks." },
      { status: 401 }
    );
  }

  const { bookId } = await context.params;
  let format: BookFormat = "PDF";
  try {
    const body = await request.json();
    if (body.format === "EPUB" || body.format === "PDF") {
      format = body.format;
    }
  } catch {
    // default PDF
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "ENOX-Client";

  const authCheck = authorizeBookDownload({
    userId: user.id,
    bookId,
    format,
    ipAddress,
    userAgent,
  });

  if (!authCheck.authorized || !authCheck.book || !authCheck.orderId) {
    return NextResponse.json(
      { error: authCheck.error || "Unauthorized download request." },
      { status: authCheck.statusCode || 403 }
    );
  }

  // Issue a short-lived (5-minute) cryptographically signed download token
  const signedToken = createSignedDownloadToken(
    {
      userId: user.id,
      bookId: authCheck.book.id,
      orderId: authCheck.orderId,
      format,
    },
    300
  );

  return NextResponse.json({
    signedUrl: `/api/downloads/stream/${signedToken}`,
    expiresInSeconds: 300,
    format,
    filename: `${authCheck.book.slug}-enox-edition.${format.toLowerCase()}`,
  });
}
