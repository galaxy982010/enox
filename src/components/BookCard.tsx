"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Star, Download, Sparkles } from "lucide-react";
import type { Book } from "@/types/enox";
import { useStore } from "@/context/StoreContext";

export function BookCard({ book }: { book: Book }) {
  const { isInCart, isWishlisted, isOwned, addToCart, toggleWishlist } = useStore();

  const inCart = isInCart(book.id);
  const inWishlist = isWishlisted(book.id);
  const owned = isOwned(book.id);

  return (
    <article className="liquid-glass-card group relative flex h-full flex-col overflow-hidden">
      {/* Cover Stage with Warm Cream + Olive/Gold Ambient Glow */}
      <div className="relative aspect-[4/4.6] w-full overflow-hidden bg-gradient-to-br from-[#F7F3EB] via-[#EDE9DA] to-[#B89455]/18 p-5 flex items-center justify-center border-b border-[#E8E1D6]">
        {/* Decorative ambient glow behind cover on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-40 w-40 rounded-full bg-[#B89455]/25 blur-2xl opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"
        />

        <Link
          href={`/books/${book.slug}`}
          className="book-cover-3d relative z-10 h-full w-auto aspect-[3/4.2] overflow-hidden rounded-[10px] shadow-[0_12px_28px_-6px_rgba(41,41,41,0.22)]"
        >
          <img
            src={book.cover_image}
            alt={`Cover of ${book.title} by ${book.author}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </Link>

        {/* Top-Left Warm Gold Featured Badge */}
        {book.is_featured && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#B89455]/55 bg-[#F7F3EB]/92 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#7D5D26] shadow-xs">
              <Sparkles className="h-3 w-3 text-[#B89455]" />
              <span>Featured</span>
            </span>
          </div>
        )}

        {/* Top-Right Liquid Glass Wishlist Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(book)}
          aria-label={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
          className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-[8px] border backdrop-blur-md transition-all duration-200 ${
            inWishlist
              ? "border-[#C84444]/40 bg-white text-[#C84444] scale-105 shadow-xs"
              : "border-[#E8E1D6] bg-white/85 text-[#77736D] hover:text-[#C84444] hover:border-[#B89455] hover:bg-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Muted Olive Category Pill */}
            <span className="inline-flex items-center rounded-[6px] border border-[#7C8665]/35 bg-[#7C8665]/12 px-2 py-0.5 text-[11px] font-semibold text-[#4F583D] truncate">
              {book.category_name}
            </span>

            {/* Warm Gold Rating shown ONLY when real review data exists */}
            {book.review_count > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#292929] shrink-0">
                <Star className="h-3.5 w-3.5 fill-[#B89455] text-[#B89455]" />
                {book.rating_avg.toFixed(1)}
                <span className="text-[#77736D] font-normal">({book.review_count})</span>
              </span>
            )}
          </div>

          <Link href={`/books/${book.slug}`} className="mt-2.5 block">
            <h3 className="text-[18px] font-semibold text-[#292929] group-hover:text-[#7C8665] transition-colors line-clamp-2 leading-snug">
              {book.title}
            </h3>
          </Link>

          <p className="mt-1.5 text-xs text-[#77736D]">
            By{" "}
            {book.creator_slug ? (
              <Link
                href={`/creators/${book.creator_slug}`}
                className="font-semibold text-[#292929] hover:text-[#7C8665] hover:underline"
              >
                {book.author}
              </Link>
            ) : (
              <span className="font-semibold text-[#292929]">{book.author}</span>
            )}
          </p>
        </div>

        {/* Price & Action Footer */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E8E1D6] pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#292929]">
              ₹{book.price_inr.toLocaleString("en-IN")}
            </span>
            {book.original_price_inr && book.original_price_inr > book.price_inr && (
              <span className="text-xs text-[#77736D] line-through">
                ₹{book.original_price_inr.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {owned ? (
            <Link
              href="/account?tab=library"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#287A52]/35 bg-[#287A52]/12 px-3.5 py-2 text-xs font-semibold text-[#287A52] hover:bg-[#287A52]/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Library</span>
            </Link>
          ) : inCart ? (
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#7C8665]/45 bg-[#7C8665]/15 px-3.5 py-2 text-xs font-semibold text-[#292929] hover:bg-[#7C8665]/25 transition-colors"
            >
              <Check className="h-3.5 w-3.5 text-[#287A52]" />
              <span>In Cart</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(book)}
              className="btn-primary-glass inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-[#B89455]" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
