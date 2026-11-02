"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Flag,
  Globe,
  Hash,
  Heart,
  Library,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Star,
  User,
  X,
  Zap,
} from "lucide-react";
import type { Book, BookFormat, Review } from "@/types/enox";
import { useStore } from "@/context/StoreContext";
import { BookCard } from "./BookCard";

export function BookDetailClient({
  book,
  initialReviews,
  relatedBooks,
}: {
  book: Book;
  initialReviews: Review[];
  relatedBooks: Book[];
}) {
  const router = useRouter();
  const {
    user,
    addToCart,
    isInCart,
    isOwned,
    isWishlisted,
    toggleWishlist,
    showToast,
  } = useStore();

  const owned = isOwned(book.id);
  const inCart = isInCart(book.id);
  const wishlisted = isWishlisted(book.id);

  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);
  const [downloadingFormat, setDownloadingFormat] = useState<BookFormat | null>(null);

  // Report Product Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reporterName, setReporterName] = useState(user?.full_name || "");
  const [reporterEmail, setReporterEmail] = useState(user?.email || "");
  const [reportReason, setReportReason] = useState("Copyright or IP Infringement");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const discountPercent =
    book.original_price_inr && book.original_price_inr > book.price_inr
      ? Math.round(
          ((book.original_price_inr - book.price_inr) / book.original_price_inr) * 100
        )
      : null;

  const handleBuyNow = () => {
    if (owned) {
      router.push("/account?tab=library");
      return;
    }
    if (!inCart) {
      addToCart(book);
    }
    router.push("/checkout");
  };

  const handleSecureDownload = async (format: BookFormat) => {
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/downloads/${book.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        showToast(
          "Download Denied",
          data.error || "Could not verify ownership for download.",
          "error"
        );
        return;
      }
      showToast(
        "Signed Link Ready",
        `Starting secure ${format} download (valid for 5 minutes).`,
        "success"
      );
      window.location.href = data.signedUrl;
    } catch {
      showToast("Download Error", "Failed to request signed download URL.", "error");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          rating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Could not submit review.");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      setReviewTitle("");
      setReviewComment("");
      showToast(
        "Review Published",
        "Your verified purchaser review has been added.",
        "success"
      );
    } catch {
      setReviewError("Network error while submitting review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "copyright",
          bookId: book.id,
          reporterName: reporterName || user?.full_name || "Marketplace Reader",
          reporterEmail: reporterEmail || user?.email || "",
          reason: reportReason,
          details: reportDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || "Could not submit product report.");
        return;
      }
      setReportModalOpen(false);
      setReportDetails("");
      showToast(
        "Report Submitted",
        "Thank you. Our trust & copyright team will review this product.",
        "success"
      );
    } catch {
      setReportError("Network error while submitting report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#77736D] flex items-center gap-2">
        <Link href="/" className="hover:text-[#33312E] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/books" className="hover:text-[#33312E] transition-colors">
          Discover
        </Link>
        <span>/</span>
        <Link
          href={`/books?category=${book.category_slug}`}
          className="hover:text-[#33312E] transition-colors"
        >
          {book.category_name}
        </Link>
        <span>/</span>
        <span className="text-[#33312E] font-semibold truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="rounded-[22px] bg-white/90 backdrop-blur-xl p-6 sm:p-10 lg:p-12 border border-[#E8E1D6] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Cover Artwork + Sample Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[5/6.5] rounded-[16px] bg-[#EFE9DC]/65 border border-[#E8E1D6] p-6 flex items-center justify-center relative">
            <img
              src={book.cover_image}
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-contain rounded-[10px] shadow-[0_14px_32px_-8px_rgba(41,41,41,0.2)]"
            />
            {book.is_featured && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-[8px] text-[11px] font-semibold bg-[#F7F3EB]/95 border border-[#33312E]/35 text-[#33312E]">
                Featured
              </span>
            )}
          </div>

          {book.sample_pages && book.sample_pages.length > 0 && (
            <button
              type="button"
              onClick={() => setSampleModalOpen(true)}
              className="w-full py-3 px-4 rounded-[12px] text-xs font-semibold border border-[#E8E1D6] bg-[#F7F3EB] text-[#33312E] hover:border-[#33312E] hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#33312E]" />
              <span>Preview Sample Excerpt ({book.sample_pages.length} Chapters)</span>
            </button>
          )}
        </div>

        {/* Right Details & Purchase Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/books?category=${book.category_slug}`}
                  className="px-3 py-1 rounded-[8px] bg-[#F7F3EB] border border-[#E8E1D6] text-xs font-semibold text-[#33312E]"
                >
                  {book.category_name}
                </Link>
                <span className="text-xs font-medium text-[#77736D]">
                  Formats: {book.formats.join(" + ")}
                </span>
              </div>

              {/* Report Product Option */}
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77736D] hover:text-[#C84444] transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report product</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-[#33312E] tracking-tight leading-tight">
              {book.title}
            </h1>

            {book.subtitle && (
              <p className="text-base text-[#77736D] font-normal">{book.subtitle}</p>
            )}

            {/* Creator Identity with Link to Creator Storefront */}
            <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
              <div className="inline-flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#33312E] text-white text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </span>
                <span className="text-[#77736D]">Created by</span>
                {book.creator_slug ? (
                  <Link
                    href={`/creators/${book.creator_slug}`}
                    className="font-semibold text-[#33312E] underline decoration-[#E8E1D6] underline-offset-4 hover:decoration-[#33312E]"
                  >
                    {book.author}
                  </Link>
                ) : (
                  <span className="font-semibold text-[#33312E]">{book.author}</span>
                )}
              </div>

              {reviews.length > 0 && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#33312E] bg-[#F7F3EB] border border-[#E8E1D6] px-3 py-1 rounded-[8px]">
                  <Star className="w-3.5 h-3.5 fill-[#33312E] text-[#33312E]" />
                  <span>{book.rating_avg.toFixed(1)}</span>
                  <span className="text-[#77736D] font-normal">
                    ({reviews.length} verified {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
            </div>

            {/* Price Block */}
            <div className="rounded-[16px] bg-[#F7F3EB]/85 p-5 border border-[#E8E1D6] flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#77736D] block">
                  Price
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-bold text-[#33312E]">
                    ₹{book.price_inr.toLocaleString("en-IN")}
                  </span>
                  {book.original_price_inr && book.original_price_inr > book.price_inr && (
                    <span className="text-sm text-[#77736D] line-through">
                      ₹{book.original_price_inr.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#287A52]/12 text-[#287A52] border border-[#287A52]/25">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-[#77736D] space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-[#33312E]">
                  <CheckCircle2 className="w-4 h-4 text-[#287A52]" />
                  <span>Instant Digital Download</span>
                </p>
                <p>Includes {book.formats.join(" & ")} · DRM-Free</p>
              </div>
            </div>

            {/* Action Buttons */}
            {owned ? (
              <div className="rounded-[16px] p-5 border border-[#287A52]/30 bg-[#287A52]/8 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#287A52]">
                  <Library className="w-4 h-4" />
                  <span>You own this product in your ENOX Download Library</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {book.formats.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={downloadingFormat === fmt}
                      onClick={() => handleSecureDownload(fmt)}
                      className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white hover:bg-[#3d3d3d] inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingFormat === fmt
                          ? `Preparing ${fmt}...`
                          : `Download ${fmt}`}
                      </span>
                    </button>
                  ))}
                  <Link
                    href="/account?tab=library"
                    className="px-4 py-2.5 rounded-[10px] text-xs font-semibold border border-[#E8E1D6] bg-white text-[#33312E]"
                  >
                    Open Library
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 min-w-44 py-3.5 px-6 rounded-[12px] text-sm font-semibold bg-[#33312E] text-white hover:bg-[#3d3d3d] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>

                {inCart ? (
                  <Link
                    href="/cart"
                    className="flex-1 min-w-44 py-3.5 px-6 rounded-[12px] text-sm font-semibold border border-[#33312E] bg-[#F7F3EB] text-[#33312E] inline-flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-[#287A52]" />
                    <span>In Cart · View Cart</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(book)}
                    className="flex-1 min-w-44 py-3.5 px-6 rounded-[12px] text-sm font-semibold border border-[#E8E1D6] bg-white text-[#33312E] hover:border-[#33312E] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleWishlist(book)}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`p-3.5 rounded-[12px] border transition-colors cursor-pointer ${
                    wishlisted
                      ? "bg-[#C84444]/10 border-[#C84444]/30 text-[#C84444]"
                      : "border-[#E8E1D6] bg-white text-[#33312E] hover:border-[#33312E]"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      wishlisted ? "fill-[#C84444] text-[#C84444]" : ""
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Clear Description */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#33312E]">
                Product Description
              </h2>
              {book.full_description.split("\n\n").map((para, idx) => (
                <p key={idx} className="text-sm text-[#77736D] leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Contents / Key Benefits */}
            {book.highlights && book.highlights.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#33312E]">
                  Contents &amp; Key Benefits
                </h3>
                <ul className="space-y-2">
                  {book.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-[#77736D]">
                      <CheckCircle2 className="w-4 h-4 text-[#33312E] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* File Format & Product Details Grid */}
          <div className="pt-6 border-t border-[#E8E1D6] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-[10px] bg-[#F7F3EB] border border-[#E8E1D6]/70 space-y-1">
              <span className="text-[#77736D] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Length &amp; Size
              </span>
              <p className="font-semibold text-[#33312E]">
                {book.pages} Pages ({book.file_size_label})
              </p>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F7F3EB] border border-[#E8E1D6]/70 space-y-1">
              <span className="text-[#77736D] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Language
              </span>
              <p className="font-semibold text-[#33312E]">{book.language}</p>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F7F3EB] border border-[#E8E1D6]/70 space-y-1">
              <span className="text-[#77736D] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Published
              </span>
              <p className="font-semibold text-[#33312E]">{book.publication_date}</p>
            </div>
            <div className="p-3 rounded-[10px] bg-[#F7F3EB] border border-[#E8E1D6]/70 space-y-1">
              <span className="text-[#77736D] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Reference ID
              </span>
              <p className="font-semibold text-[#33312E] truncate">{book.isbn || "ENOX-ED"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Card & Download Policy Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[16px] border border-[#E8E1D6] bg-white/88 backdrop-blur-md p-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#33312E]">
              About the Creator
            </h2>
            {book.creator_slug && (
              <Link
                href={`/creators/${book.creator_slug}`}
                className="text-xs font-semibold text-[#33312E] hover:underline"
              >
                View Creator Storefront →
              </Link>
            )}
          </div>
          <p className="text-base font-bold text-[#33312E]">{book.author}</p>
          <p className="text-xs text-[#77736D] leading-relaxed">
            {book.author_bio || `${book.author} publishes verified digital resources on ENOX.`}
          </p>
        </div>

        <div className="rounded-[16px] border border-[#E8E1D6] bg-white/88 backdrop-blur-md p-6 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#33312E] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#33312E]" />
            <span>Purchase &amp; Download Protection</span>
          </h2>
          <p className="text-xs text-[#77736D] leading-relaxed">
            After purchase, this digital product is permanently added to your ENOX Download Library.
            Downloads are served over short-lived cryptographically signed links from private storage.
          </p>
        </div>
      </div>

      {/* VERIFIED PURCHASER REVIEWS */}
      <section aria-labelledby="reviews-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#33312E]">
              Customer Feedback
            </p>
            <h2
              id="reviews-heading"
              className="text-2xl font-bold text-[#33312E] tracking-tight mt-1"
            >
              Reviews from Verified Purchases ({reviews.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-[16px] border border-[#E8E1D6] bg-white/88 p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-[#33312E]">
                  No verified reviews yet for this product.
                </p>
                <p className="text-xs text-[#77736D]">
                  Only customers who have purchased this product on ENOX can post a review.
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="rounded-[16px] border border-[#E8E1D6] bg-white/88 p-6 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < rev.rating
                                ? "fill-[#33312E] text-[#33312E]"
                                : "text-[#E8E1D6]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#33312E]">{rev.title}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-[#287A52]/10 text-[#287A52] border border-[#287A52]/25 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  </div>
                  <p className="text-xs text-[#77736D] leading-relaxed">{rev.comment}</p>
                  <p className="text-[11px] text-[#77736D]">
                    By <strong className="text-[#33312E]">{rev.reviewer_name}</strong> ·{" "}
                    {new Date(rev.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </article>
              ))
            )}
          </div>

          {/* Review Submission Box */}
          <div className="lg:col-span-5">
            <div className="rounded-[16px] bg-white/90 p-6 border border-[#E8E1D6] space-y-4">
              <h3 className="text-base font-bold text-[#33312E]">
                Write a Verified Review
              </h3>
              {!user ? (
                <div className="space-y-3 text-xs text-[#77736D]">
                  <p>
                    Please sign in with an account that owns this product to leave a review.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block px-4 py-2.5 rounded-[10px] bg-[#33312E] text-white font-semibold"
                  >
                    Sign In to Review
                  </Link>
                </div>
              ) : !owned && user.role !== "admin" ? (
                <div className="p-4 rounded-[12px] bg-[#F7F3EB] border border-[#E8E1D6] text-xs text-[#77736D] space-y-1.5">
                  <p className="font-semibold text-[#33312E]">Verified Purchase Required</p>
                  <p>
                    To keep ENOX ratings trustworthy, reviews can only be submitted after purchasing
                    this product.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#33312E] mb-1">
                      Rating (1 to 5)
                    </label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs font-semibold text-[#33312E]"
                    >
                      <option value={5}>5 Stars — Highly Recommended</option>
                      <option value={4}>4 Stars — Very Useful</option>
                      <option value={3}>3 Stars — Good Resource</option>
                      <option value={2}>2 Stars — Below Expectations</option>
                      <option value={1}>1 Star — Not Recommended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#33312E] mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Summarize your experience"
                      className="w-full px-3.5 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs text-[#33312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#33312E] mb-1">
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share specific feedback on quality, clarity, and structure..."
                      className="w-full px-3.5 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs text-[#33312E]"
                    />
                  </div>
                  {reviewError && (
                    <p role="alert" className="text-xs font-semibold text-[#C84444]">
                      {reviewError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white hover:bg-[#3d3d3d] cursor-pointer"
                  >
                    {reviewSubmitting ? "Submitting..." : "Publish Verified Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedBooks.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-6">
          <h2
            id="related-heading"
            className="text-2xl font-bold text-[#33312E] tracking-tight"
          >
            Related Products in {book.category_name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedBooks.map((rel) => (
              <BookCard key={rel.id} book={rel} />
            ))}
          </div>
        </section>
      )}

      {/* SAMPLE PREVIEW MODAL */}
      {sampleModalOpen && book.sample_pages.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Sample preview for ${book.title}`}
          className="fixed inset-0 z-50 bg-[#33312E]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="rounded-[20px] bg-white max-w-2xl w-full p-6 sm:p-8 border border-[#E8E1D6] shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E1D6] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#33312E]">
                  ENOX Sample Excerpt
                </span>
                <h3 className="text-lg font-bold text-[#33312E]">{book.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSampleModalOpen(false)}
                aria-label="Close sample preview"
                className="p-2 rounded-[8px] border border-[#E8E1D6] text-[#33312E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {book.sample_pages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {book.sample_pages.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSampleIdx(idx)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold cursor-pointer ${
                      activeSampleIdx === idx
                        ? "bg-[#33312E] text-white"
                        : "bg-[#F7F3EB] text-[#33312E]"
                    }`}
                  >
                    Chapter {sp.chapter_number}: {sp.chapter_title}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-y-auto pr-2 space-y-4 text-sm text-[#33312E] leading-relaxed bg-[#F7F3EB]/70 p-6 rounded-[14px] border border-[#E8E1D6]">
              <h4 className="text-base font-bold text-[#33312E]">
                Chapter {book.sample_pages[activeSampleIdx]?.chapter_number}:{" "}
                {book.sample_pages[activeSampleIdx]?.chapter_title}
              </h4>
              {book.sample_pages[activeSampleIdx]?.content
                .split("\n\n")
                .map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#77736D]">
                Full edition: {book.pages} pages ({book.formats.join(" & ")})
              </span>
              <button
                type="button"
                onClick={() => {
                  setSampleModalOpen(false);
                  handleBuyNow();
                }}
                className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
              >
                Buy Now · ₹{book.price_inr.toLocaleString("en-IN")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PRODUCT MODAL */}
      {reportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Report ${book.title}`}
          className="fixed inset-0 z-50 bg-[#33312E]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="rounded-[20px] bg-white max-w-md w-full p-6 sm:p-7 border border-[#E8E1D6] shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E1D6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#33312E]">Report Product</h3>
                <p className="text-xs text-[#77736D] mt-0.5">{book.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-[8px] border border-[#E8E1D6] text-[#77736D] hover:text-[#33312E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#33312E] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-[10px] border border-[#E8E1D6] px-3.5 py-2 text-xs text-[#33312E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#33312E] mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-[10px] border border-[#E8E1D6] px-3.5 py-2 text-xs text-[#33312E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#33312E] mb-1">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-[10px] border border-[#E8E1D6] px-3.5 py-2 text-xs font-medium text-[#33312E]"
                >
                  <option value="Copyright or IP Infringement">
                    Copyright or IP Infringement
                  </option>
                  <option value="Plagiarized or Unauthorized Content">
                    Plagiarized or Unauthorized Content
                  </option>
                  <option value="Misleading Product Description">
                    Misleading Product Description
                  </option>
                  <option value="Corrupted or Broken File">Corrupted or Broken File</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#33312E] mb-1">
                  Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide links or details to help our review team investigate..."
                  className="w-full rounded-[10px] border border-[#E8E1D6] px-3.5 py-2 text-xs text-[#33312E]"
                />
              </div>
              {reportError && (
                <p className="text-xs font-semibold text-[#C84444]">{reportError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-[10px] border border-[#E8E1D6] px-4 py-2 text-xs font-semibold text-[#33312E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="rounded-[10px] bg-[#33312E] px-4 py-2 text-xs font-semibold text-white"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
