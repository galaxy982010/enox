import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { getUserWishlist, toggleUserWishlist } from "@/lib/db/store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const wishlist = getUserWishlist(user.id);
  return NextResponse.json({ wishlist });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to save ebooks to your wishlist." },
      { status: 401 }
    );
  }
  const body = await request.json();
  const bookId = String(body.bookId || "");
  if (!bookId) {
    return NextResponse.json({ error: "Book ID is required." }, { status: 400 });
  }
  const result = toggleUserWishlist(user.id, bookId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result);
}
