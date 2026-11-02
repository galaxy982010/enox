import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  BookOpen,
  Compass,
  Layers,
  Sparkles,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Download,
  Star,
  CheckCircle2,
} from "lucide-react";
import {
  getCategoriesWithCounts,
  getCreatorsWithProducts,
  getPublishedBooks,
} from "@/lib/db/store";
import { BookCard } from "@/components/BookCard";
import { EnoxLogo } from "@/components/EnoxLogo";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Compass,
  Layers,
  Sparkles,
  Calendar,
  TrendingUp,
};

export default function HomePage() {
  const { books: featuredBooks } = getPublishedBooks({
    featuredOnly: true,
    pageSize: 6,
  });
  const { books: allBooks } = getPublishedBooks({
    sort: "popularity",
    pageSize: 8,
  });
  const categories = getCategoriesWithCounts();
  const creators = getCreatorsWithProducts();

  const displayedProducts = featuredBooks.length >= 4 ? featuredBooks : allBooks.slice(0, 6);
  const heroShowcaseBooks = displayedProducts.slice(0, 3);

  return (
    <div className="space-y-20 pb-24">
      {/* 1. HERO SECTION + 2. PROMINENT PRODUCT SEARCH + FLOATING LIQUID GLASS SHOWCASE */}
      <section className="relative overflow-hidden border-b border-[#E8E1D6] bg-gradient-to-b from-[#F7F3EB] via-[#F7F3EB] to-[#EDE9DA]/90 pt-10 pb-16 sm:pt-16 sm:pb-24">
        {/* Animated Ambient Color Orbs for Liquid Glass Refraction */}
        <div
          aria-hidden="true"
          className="animate-orb-slow pointer-events-none absolute -top-20 -left-20 h-[380px] w-[380px] rounded-full bg-[#B89455]/24 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-orb-reverse pointer-events-none absolute top-12 -right-20 h-[420px] w-[420px] rounded-full bg-[#7C8665]/22 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-orb-slow pointer-events-none absolute bottom-0 left-1/3 h-[280px] w-[480px] rounded-full bg-[#EDE9DA] blur-2xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Editorial Headline, CTAs & Prominent Search */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="animate-fade-up liquid-glass-pill inline-flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-semibold text-[#292929]">
                <span className="animate-pulse-olive h-2.5 w-2.5 rounded-full bg-[#7C8665]" />
                <span>ENOX Ebooks — Curated Digital Products Marketplace</span>
                <span className="rounded-md bg-[#B89455]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#7D5D26]">
                  DRM-FREE
                </span>
              </div>

              <h1 className="animate-fade-up-delay-1 mt-6 text-[36px] sm:text-[50px] lg:text-[58px] font-bold tracking-tight text-[#292929] leading-[1.08]">
                Discover Ideas Worth{" "}
                <span className="bg-gradient-to-r from-[#292929] via-[#7C8665] to-[#B89455] bg-clip-text text-transparent">
                  Investing In.
                </span>
              </h1>

              <p className="animate-fade-up-delay-2 mx-auto lg:mx-0 mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-[#77736D]">
                Explore ebooks, guides, templates, and digital resources created by people who know
                their craft.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/books"
                  className="btn-primary-glass inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="h-4 w-4 text-[#B89455]" />
                </Link>
                <Link
                  href="/creator"
                  className="btn-secondary-glass inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold"
                >
                  <Sparkles className="h-4 w-4 text-[#7C8665]" />
                  <span>Start Selling</span>
                </Link>
              </div>

              {/* Prominent Liquid Glass Search Section */}
              <div className="animate-fade-up-delay-3 mx-auto lg:mx-0 mt-9 max-w-2xl">
                <form
                  action="/books"
                  method="GET"
                  role="search"
                  className="liquid-glass-strong flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-[16px] p-2 focus-within:outline-[#7C8665] transition-all"
                >
                  <div className="relative flex flex-1 items-center">
                    <Search className="h-4 w-4 text-[#7C8665] absolute left-3.5 pointer-events-none" />
                    <input
                      type="search"
                      name="q"
                      placeholder="Search ebooks, templates, guides..."
                      aria-label="Search ebooks, templates, guides"
                      className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm sm:text-base text-[#292929] placeholder:text-[#77736D] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary-glass inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold shrink-0 cursor-pointer"
                  >
                    <Search className="h-4 w-4 text-[#B89455]" />
                    <span>Search</span>
                  </button>
                </form>

                {/* Quick Filter Pills */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-[#77736D]">
                  <span className="font-medium text-[#292929]">Popular:</span>
                  <Link
                    href="/books?category=ebooks-guides"
                    className="rounded-[8px] border border-[#7C8665]/35 bg-[#7C8665]/12 px-2.5 py-1 font-medium text-[#4F583D] hover:bg-[#7C8665] hover:text-white transition-all"
                  >
                    Ebooks &amp; Guides
                  </Link>
                  <Link
                    href="/books?category=templates"
                    className="rounded-[8px] border border-[#B89455]/40 bg-[#B89455]/15 px-2.5 py-1 font-medium text-[#7D5D26] hover:bg-[#B89455] hover:text-white transition-all"
                  >
                    Templates
                  </Link>
                  <Link
                    href="/books?category=ai-prompts"
                    className="rounded-[8px] border border-[#E8E1D6] bg-white/80 px-2.5 py-1 font-medium text-[#292929] hover:border-[#7C8665] hover:bg-white transition-all"
                  >
                    AI Prompts
                  </Link>
                  <Link
                    href="/books?category=study-resources"
                    className="rounded-[8px] border border-[#E8E1D6] bg-white/80 px-2.5 py-1 font-medium text-[#292929] hover:border-[#B89455] hover:bg-white transition-all"
                  >
                    Study Resources
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Floating Liquid Glass Cover Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="liquid-glass-cream relative mx-auto max-w-md rounded-[22px] p-6 sm:p-7">
                {/* Floating Top Status Pill */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E8E1D6]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#7C8665] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#292929]">Curated Shelf</p>
                      <p className="text-[11px] text-[#77736D]">Instant PDF &amp; EPUB Delivery</p>
                    </div>
                  </div>
                  <span className="badge-gold-glass rounded-[8px] px-2.5 py-1 text-[11px] font-bold">
                    Verified Creators
                  </span>
                </div>

                {/* Floating 3-Book Showcase Stack */}
                <div className="mt-5 grid grid-cols-3 gap-3.5 items-end">
                  {heroShowcaseBooks.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/books/${item.slug}`}
                      className={`group block ${
                        idx === 1 ? "animate-float-card -mt-3" : "animate-float-card-delayed"
                      }`}
                    >
                      <div className="book-cover-3d overflow-hidden rounded-[10px] border border-white/80 shadow-[0_14px_28px_-8px_rgba(41,41,41,0.22)]">
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          className="aspect-[3/4.2] w-full object-cover"
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-[#292929] truncate group-hover:text-[#7C8665]">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-bold text-[#7D5D26]">
                        ₹{item.price_inr.toLocaleString("en-IN")}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Bottom Trust Bar inside Glass Card */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 pt-4 border-t border-[#E8E1D6]">
                  <div className="liquid-glass-olive rounded-[12px] p-3 flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#287A52] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#292929]">100% DRM-Free</p>
                      <p className="text-[10px] text-[#524F49]">Lifetime Library Access</p>
                    </div>
                  </div>
                  <div className="liquid-glass-gold rounded-[12px] p-3 flex items-center gap-2.5">
                    <Star className="h-4 w-4 fill-[#B89455] text-[#B89455] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#292929]">Creator Direct</p>
                      <p className="text-[10px] text-[#524F49]">Up to 80% Creator Share</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="badge-olive-glass inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
              Directory
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#292929]">
              Browse Categories
            </h2>
          </div>
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C8665] hover:text-[#292929] transition-colors"
          >
            <span>View all categories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, idx) => {
            const IconComponent = CATEGORY_ICONS[cat.icon_name] || BookOpen;
            const isGold = idx % 2 === 1;
            return (
              <Link
                key={cat.id}
                href={`/books?category=${cat.slug}`}
                className="liquid-glass-card group flex items-start justify-between gap-4 p-6"
              >
                <div className="relative z-10 space-y-2.5">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] border transition-all duration-300 ${
                      isGold
                        ? "border-[#B89455]/45 bg-[#B89455]/15 text-[#7D5D26] group-hover:bg-[#B89455] group-hover:text-white"
                        : "border-[#7C8665]/40 bg-[#7C8665]/15 text-[#4F583D] group-hover:bg-[#7C8665] group-hover:text-white"
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="pt-1 text-lg font-semibold text-[#292929] group-hover:text-[#7C8665] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[#77736D] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>
                <span
                  className={`relative z-10 rounded-[8px] px-2.5 py-1 text-xs font-bold shrink-0 ${
                    isGold ? "badge-gold-glass" : "badge-olive-glass"
                  }`}
                >
                  {cat.book_count || 0}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED EBOOKS AND DIGITAL PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="badge-gold-glass inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
              Curated Selection
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#292929]">
              Featured Products
            </h2>
          </div>
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C8665] hover:text-[#292929] transition-colors"
          >
            <span>Explore full catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProducts.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 5. POPULAR CREATORS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="badge-olive-glass inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
              Independent Publishers
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#292929]">
              Popular Creators
            </h2>
          </div>
          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C8665] hover:text-[#292929] transition-colors"
          >
            <span>Launch your storefront</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {creators.map((creator, idx) => (
            <Link
              key={creator.id}
              href={`/creators/${creator.slug}`}
              className="liquid-glass-card group flex flex-col justify-between p-6"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold text-white shadow-xs ${
                      idx % 2 === 0
                        ? "bg-gradient-to-br from-[#292929] to-[#7C8665]"
                        : "bg-gradient-to-br from-[#292929] to-[#B89455]"
                    }`}
                  >
                    {creator.initials || creator.avatar_initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#292929] group-hover:text-[#7C8665] transition-colors truncate">
                      {creator.name}
                    </h3>
                    <p className="text-xs text-[#77736D] truncate">
                      {creator.tagline || creator.specialty}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#524F49] leading-relaxed line-clamp-3">
                  {creator.bio || creator.short_bio}
                </p>
              </div>

              <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[#E8E1D6] pt-3.5 text-xs font-semibold text-[#292929]">
                <span className="rounded-[6px] bg-[#EDE9DA] px-2 py-0.5 text-[#292929]">
                  {creator.published_products_count}{" "}
                  {creator.published_products_count === 1 ? "Product" : "Products"}
                </span>
                <span className="inline-flex items-center gap-1 text-[#7C8665] group-hover:translate-x-1 transition-transform">
                  <span>Storefront</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. HOW ENOX WORKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="liquid-glass-strong relative overflow-hidden rounded-[22px] p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#B89455]/18 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <span className="badge-olive-glass inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
              Simple &amp; Transparent
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#292929]">
              How ENOX Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#77736D]">
              From discovery to instant digital access in three straightforward steps.
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="liquid-glass-olive rounded-[16px] p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#7C8665] text-white shadow-xs">
                  <Compass className="h-5 w-5" />
                </span>
                <span className="rounded-[6px] bg-white/80 px-2.5 py-1 text-xs font-bold text-[#4F583D]">
                  STEP 01
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#292929]">
                1. Discover a product
              </h3>
              <p className="mt-2 text-sm text-[#524F49] leading-relaxed">
                Browse curated ebooks, study resources, templates, and planners with sample chapter
                previews and clear file specifications.
              </p>
            </div>

            <div className="liquid-glass-gold rounded-[16px] p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#B89455] text-white shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="rounded-[6px] bg-white/80 px-2.5 py-1 text-xs font-bold text-[#7D5D26]">
                  STEP 02
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#292929]">
                2. Purchase securely
              </h3>
              <p className="mt-2 text-sm text-[#524F49] leading-relaxed">
                Complete checkout in INR with server-verified pricing and cryptographic order
                confirmation.
              </p>
            </div>

            <div className="liquid-glass-olive rounded-[16px] p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#287A52] text-white shadow-xs">
                  <Download className="h-5 w-5" />
                </span>
                <span className="rounded-[6px] bg-white/80 px-2.5 py-1 text-xs font-bold text-[#287A52]">
                  STEP 03
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#292929]">
                3. Access your digital download
              </h3>
              <p className="mt-2 text-sm text-[#524F49] leading-relaxed">
                Download your DRM-free PDF and EPUB files immediately from your personal ENOX
                Download Library anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BECOME A CREATOR CALL TO ACTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="liquid-glass-gold relative overflow-hidden rounded-[22px] p-8 sm:p-12 lg:p-14">
          <div
            aria-hidden="true"
            className="animate-orb-slow pointer-events-none absolute -top-24 right-12 h-72 w-72 rounded-full bg-[#B89455]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="animate-orb-reverse pointer-events-none absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-[#7C8665]/22 blur-3xl"
          />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <EnoxLogo size="sm" />
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#292929]">
                Your Knowledge Deserves an Audience.
              </h2>
              <p className="text-base sm:text-lg text-[#524F49] leading-relaxed">
                Publish your digital products and build your creator business with ENOX.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold">
                <span className="badge-olive-glass rounded-[8px] px-3 py-1.5">
                  Free Creator: ₹0/month · Max 5 listings · 30% commission
                </span>
                <span className="badge-gold-glass rounded-[8px] px-3 py-1.5">
                  ENOX Premium: ₹999/month · Max 25 listings · 20% commission
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/creator"
                className="btn-primary-glass inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold"
              >
                <span>Become a Creator</span>
                <ArrowRight className="h-4 w-4 text-[#B89455]" />
              </Link>
              <Link
                href="/pricing"
                className="btn-secondary-glass inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold"
              >
                <span>Compare Plans</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
