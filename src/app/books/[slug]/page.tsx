import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedBookBySlug,
  getPublishedBooks,
  getPublishedReviewsForBook,
} from "@/lib/db/store";
import { BookDetailClient } from "@/components/BookDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getPublishedBookBySlug(slug);
  if (!book) {
    return {
      title: "Book Not Found",
    };
  }
  return {
    title: `${book.title} by ${book.author}`,
    description: book.short_description,
    openGraph: {
      title: `${book.title} | ENOX Ebooks`,
      description: book.short_description,
      images: [book.cover_image],
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getPublishedBookBySlug(slug);
  if (!book) {
    notFound();
  }

  const reviews = getPublishedReviewsForBook(book.id);
  const related = getPublishedBooks({
    category: book.category_slug,
    pageSize: 4,
  }).books.filter((b) => b.id !== book.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    isbn: book.isbn,
    numberOfPages: book.pages,
    inLanguage: book.language,
    bookFormat: "https://schema.org/EBook",
    description: book.short_description,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: book.price_inr,
      availability: "https://schema.org/InStock",
    },
    ...(book.review_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: book.rating_avg,
            reviewCount: book.review_count,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailClient
        book={book}
        initialReviews={reviews}
        relatedBooks={related}
      />
    </>
  );
}
