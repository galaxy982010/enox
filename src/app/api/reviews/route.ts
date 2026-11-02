import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import { createVerifiedReview } from "@/lib/db/store";

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to submit a review." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const res = createVerifiedReview({
      userId: user.id,
      bookId: String(body.bookId || ""),
      rating: Number(body.rating),
      title: String(body.title || ""),
      comment: String(body.comment || ""),
    });

    if (res.error || !res.review) {
      return NextResponse.json(
        { error: res.error || "Could not submit review." },
        { status: res.statusCode || 400 }
      );
    }

    return NextResponse.json({ review: res.review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }
}
