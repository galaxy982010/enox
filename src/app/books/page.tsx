"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Book, BookFormat, Category } from "@/types/enox";
import { BookCard } from "@/components/BookCard";

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [maxPrice, setMaxPrice] = useState<number>(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 2000
  );
  const [minRating, setMinRating] = useState<number>(
    searchParams.get("minRating") ? Number(searchParams.get("minRating")) : 0
  );
  const [format, setFormat] = useState<BookFormat | "ALL">(
    (searchParams.get("format") as BookFormat | "ALL") || "ALL"
  );
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "featured");
  const [page, setPage] = useState<number>(
    searchParams.get("page") ? Number(searchParams.get("page")) : 1
  );

  // Sync URL query params when user navigates from header links
  useEffect(() => {
    const urlCat = searchParams.get("category");
    const urlQ = searchParams.get("q");
    if (urlCat !== null) setCategory(urlCat);
    if (urlQ !== null) setQ(urlQ);
  }, [searchParams]);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (category !== "all") params.set("category", category);
      if (maxPrice < 2000) params.set("maxPrice", String(maxPrice));
      if (minRating > 0) params.set("minRating", String(minRating));
      if (format !== "ALL") params.set("format", format);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", "9");

      const res = await fetch(`/api/books?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products.");
      const data = await res.json();
      setBooks(data.books || []);
      setCategories(data.categories || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected catalog error");
    } finally {
      setLoading(false);
    }
  }, [q, category, maxPrice, minRating, format, sort, page]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setMaxPrice(2000);
    setMinRating(0);
    setFormat("ALL");
    setSort("featured");
    setPage(1);
    router.replace("/books");
  };

  const renderFilterControls = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#33312E]">
          <SlidersHorizontal className="h-4 w-4 text-[#33312E]" />
          <span>Filters</span>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#77736D] hover:text-[#33312E] transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#77736D]">
          Category
        </h3>
        <div className="mt-3 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setPage(1);
            }}
            className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-xs font-medium transition-colors ${
              category === "all"
                ? "bg-[#33312E] text-white"
                : "text-[#33312E] hover:bg-[#F7F3EB]"
            }`}
          >
            <span>All Products</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.slug);
                setPage(1);
              }}
              className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-xs font-medium transition-colors ${
                category === cat.slug
                  ? "bg-[#33312E] text-white"
                  : "text-[#33312E] hover:bg-[#F7F3EB]"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span
                className={`text-[11px] ${
                  category === cat.slug ? "text-white/80" : "text-[#77736D]"
                }`}
              >
                {cat.book_count ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="max-price-range"
            className="text-xs font-bold uppercase tracking-[0.12em] text-[#77736D]"
          >
            Price Range
          </label>
          <span className="text-xs font-semibold text-[#33312E]">
            {maxPrice >= 2000 ? "Any (₹2,000+)" : `Up to ₹${maxPrice}`}
          </span>
        </div>
        <input
          id="max-price-range"
          type="range"
          min={299}
          max={2000}
          step={50}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setPage(1);
          }}
          className="mt-3 w-full accent-[#33312E]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-[#77736D]">
          <span>₹299</span>
          <span>₹1,000</span>
          <span>₹2,000+</span>
        </div>
      </div>

      {/* File Format */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#77736D]">
          Format
        </h3>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {(["ALL", "PDF", "EPUB"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => {
                setFormat(fmt);
                setPage(1);
              }}
              className={`rounded-[8px] border py-1.5 text-xs font-semibold transition-colors ${
                format === fmt
                  ? "border-[#33312E] bg-[#33312E] text-white"
                  : "border-[#E8E1D6] bg-[#F7F3EB]/70 text-[#33312E] hover:bg-[#F7F3EB]"
              }`}
            >
              {fmt === "ALL" ? "All" : fmt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-[#E8E1D6] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#33312E]">
          ENOX Marketplace
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[#33312E]">
          Discover Digital Products
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#77736D]">
          Explore ebooks, study resources, templates, AI prompt packs, planners, and business
          frameworks created by verified independent creators.
        </p>
      </div>

      {/* Top Search & Sort Bar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="h-4 w-4 text-[#77736D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search ebooks, templates, guides..."
            aria-label="Search ebooks, templates, guides"
            className="w-full rounded-[12px] border border-[#E8E1D6] bg-white/90 pl-10 pr-10 py-2.5 text-sm text-[#33312E] placeholder:text-[#77736D] focus:border-[#33312E] focus:outline-none shadow-2xs"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736D] hover:text-[#33312E]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Mobile Filter Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex lg:hidden items-center gap-2 rounded-[10px] border border-[#E8E1D6] bg-white/90 px-3.5 py-2.5 text-xs font-semibold text-[#33312E]"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#33312E]" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-medium text-[#77736D]">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-[10px] border border-[#E8E1D6] bg-white/90 px-3.5 py-2.5 text-xs font-semibold text-[#33312E] focus:border-[#33312E] focus:outline-none"
            >
              <option value="featured">Relevance & Featured</option>
              <option value="popularity">Most Popular</option>
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Desktop Filter Panel + Product Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-28 rounded-[16px] border border-[#E8E1D6] bg-white/88 backdrop-blur-md p-6">
            {renderFilterControls()}
          </div>
        </aside>

        {/* Product Results */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between text-xs text-[#77736D]">
            <span>
              Showing <strong className="text-[#33312E]">{books.length}</strong> of{" "}
              <strong className="text-[#33312E]">{total}</strong> products
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[400px] animate-pulse rounded-[16px] border border-[#E8E1D6] bg-white/60 p-5"
                >
                  <div className="h-52 w-full rounded-[12px] bg-[#EFE9DC]" />
                  <div className="mt-4 h-4 w-1/3 rounded bg-[#EFE9DC]" />
                  <div className="mt-2 h-5 w-3/4 rounded bg-[#EFE9DC]" />
                  <div className="mt-6 h-9 w-full rounded bg-[#EFE9DC]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[16px] border border-[#C84444]/30 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-[#C84444]">{error}</p>
              <button
                type="button"
                onClick={fetchCatalog}
                className="mt-4 rounded-[10px] bg-[#33312E] px-4 py-2 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-[16px] border border-[#E8E1D6] bg-white/88 backdrop-blur-md p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-[#77736D]" />
              <h3 className="mt-4 text-lg font-semibold text-[#33312E]">
                No products found. Try another search or category.
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[#77736D]">
                Clear your active filters or explore all categories in the ENOX marketplace.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-[10px] bg-[#33312E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#3d3d3d] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#33312E] disabled:opacity-40 hover:bg-[#F7F3EB]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <span className="px-3 text-xs font-medium text-[#77736D]">
                    Page <strong className="text-[#33312E]">{page}</strong> of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs font-semibold text-[#33312E] disabled:opacity-40 hover:bg-[#F7F3EB]"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compact Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#33312E]/45 backdrop-blur-xs p-0 sm:p-4 lg:hidden">
          <div className="w-full max-w-md rounded-t-[20px] sm:rounded-[20px] border border-[#E8E1D6] bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-4 mb-5">
              <h2 className="text-base font-bold text-[#33312E]">Filter Products</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-[8px] border border-[#E8E1D6] p-1.5 text-[#77736D] hover:text-[#33312E]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderFilterControls()}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full rounded-[10px] bg-[#33312E] py-3 text-xs font-semibold text-white"
            >
              Show Results ({total})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#77736D]">
          Loading ENOX catalog...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
