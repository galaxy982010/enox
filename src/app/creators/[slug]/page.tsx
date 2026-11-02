import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, MapPin, Calendar, Sparkles } from "lucide-react";
import { getCreatorBySlug } from "@/lib/db/store";
import { BookCard } from "@/components/BookCard";

export const dynamic = "force-dynamic";

export default async function CreatorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = getCreatorBySlug(slug);
  if (!result) {
    notFound();
  }

  const { creator, products } = result;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77736D] hover:text-[#33312E] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Marketplace</span>
      </Link>

      {/* Creator Header Card */}
      <section className="rounded-[22px] border border-[#E8E1D6] bg-white/90 backdrop-blur-xl p-8 sm:p-10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] text-lg font-bold text-white shadow-xs"
              style={{ backgroundColor: creator.avatar_bg || "#33312E" }}
            >
              {creator.initials}
            </div>
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#33312E] tracking-tight">
                  {creator.name}
                </h1>
                {creator.plan_tier === "premium" && (
                  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#33312E]/40 bg-[#33312E]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#292929]">
                    <Sparkles className="h-3 w-3" />
                    ENOX Premium Creator
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#33312E]">{creator.tagline}</p>
              <p className="text-sm text-[#77736D] leading-relaxed pt-1">{creator.bio}</p>

              <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-[#77736D]">
                {creator.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {creator.location}
                  </span>
                )}
                {creator.website && (
                  <span className="inline-flex items-center gap-1 text-[#33312E] font-medium">
                    <Globe className="h-3.5 w-3.5 text-[#33312E]" />
                    {creator.website}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {creator.joined_date}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E8E1D6] bg-[#F7F3EB] px-5 py-4 text-center shrink-0">
            <span className="block text-2xl font-bold text-[#33312E]">{products.length}</span>
            <span className="text-xs font-medium text-[#77736D]">
              Published {products.length === 1 ? "Product" : "Products"}
            </span>
          </div>
        </div>
      </section>

      {/* Published Products by Creator */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-4">
          <h2 className="text-xl font-bold text-[#33312E]">
            Published Products by {creator.name}
          </h2>
          <span className="text-xs text-[#77736D]">
            Showing {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[16px] border border-[#E8E1D6] bg-white/85 p-12 text-center">
            <p className="text-sm font-semibold text-[#33312E]">
              No published products available yet.
            </p>
            <p className="mt-1 text-xs text-[#77736D]">
              Products under review or in draft are not publicly listed until approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
