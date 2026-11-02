import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { verifySignedDownloadToken } from "@/lib/security/crypto";
import { doesUserOwnBook, readDb, readPrivateEbookFile } from "@/lib/db/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const payload = verifySignedDownloadToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired signed download URL. Please request a fresh link from your library." },
      { status: 403 }
    );
  }

  const sessionUser = await getServerSessionUser();
  if (!sessionUser || sessionUser.id !== payload.userId) {
    return NextResponse.json(
      { error: "Signed download token belongs to a different or unauthenticated session." },
      { status: 401 }
    );
  }

  // Re-verify active ownership at stream time in case order was refunded after token issuance
  if (!doesUserOwnBook(payload.userId, payload.bookId)) {
    return NextResponse.json(
      { error: "Ebook ownership is no longer active." },
      { status: 403 }
    );
  }

  const db = readDb();
  const book = db.books.find((b) => b.id === payload.bookId);
  if (!book) {
    return NextResponse.json({ error: "Book file not found." }, { status: 404 });
  }

  const file = readPrivateEbookFile(book, payload.format);
  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
