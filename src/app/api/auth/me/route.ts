import { NextResponse } from "next/server";
import { getServerSessionUser, setServerSessionCookie } from "@/lib/auth/session";
import {
  getUserLibrary,
  getUserOrders,
  getUserSupportRequests,
  getUserWishlist,
  updateCustomerPassword,
  updateCustomerProfile,
} from "@/lib/db/store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({
      user: null,
      libraryBookIds: [],
      wishlistBookIds: [],
      supportRequests: [],
    });
  }
  const library = getUserLibrary(user.id);
  const wishlist = getUserWishlist(user.id);
  const orders = getUserOrders(user.id);
  const supportRequests = getUserSupportRequests(user.id);

  return NextResponse.json({
    user,
    library,
    wishlist,
    orders,
    supportRequests,
    libraryBookIds: library.filter((l) => l.status === "active").map((l) => l.book_id),
    wishlistBookIds: wishlist.map((w) => w.book_id),
  });
}

export async function PATCH(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = await request.json();
  const updated = updateCustomerProfile(user.id, {
    full_name: body.full_name,
    bio: body.bio,
    newsletter_consent: body.newsletter_consent,
    creator_plan: body.creator_plan,
  });
  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  await setServerSessionCookie(updated);
  return NextResponse.json({ user: updated });
}

export async function PUT(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = await request.json();
  const res = updateCustomerPassword(
    user.id,
    String(body.currentPassword || ""),
    String(body.newPassword || "")
  );
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
