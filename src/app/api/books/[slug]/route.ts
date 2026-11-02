import { NextResponse } from "next/server";
import {
  doesUserOwnBook,
  getPublishedBookBySlug,
  getPublishedBooks,
  getPublishedReviewsForBook,
} from "@/lib/db/store";
import { getServerSessionUser } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const book = getPublishedBookBySlug(slug);
  if (!book) {
    return NextResponse.json(
      { error: "Ebook not found or not currently published." },
      { status: 404 }
    );
  }

  const user = await getServerSessionUser();
  const reviews = getPublishedReviewsForBook(book.id);
  const related = getPublishedBooks({ category: book.category_slug, pageSize: 4 }).books.filter(
    (b) => b.id !== book.id
  );
  const owned = doesUserOwnBook(user?.id, book.id);

  return NextResponse.json({
    book,
    reviews,
    related,
    owned,
  });
}
