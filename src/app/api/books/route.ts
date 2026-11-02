import { NextResponse } from "next/server";
import {
  getCategoriesWithCounts,
  getCreatorsWithProducts,
  getPublishedBooks,
} from "@/lib/db/store";
import type { BookFormat } from "@/types/enox";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  const creatorSlug = searchParams.get("creator") || undefined;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined;
  const format = (searchParams.get("format") as BookFormat | "ALL") || "ALL";
  const featuredOnly = searchParams.get("featured") === "true";
  const bestsellerOnly = searchParams.get("bestseller") === "true";
  const sort = (searchParams.get("sort") as
    | "featured"
    | "newest"
    | "popularity"
    | "price_asc"
    | "price_desc"
    | "rating") || "featured";
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 12;

  const result = getPublishedBooks({
    q,
    category,
    creatorSlug,
    minPrice,
    maxPrice,
    minRating,
    format,
    featuredOnly,
    bestsellerOnly,
    sort,
    page,
    pageSize,
  });

  const categories = getCategoriesWithCounts();
  const creators = getCreatorsWithProducts();
  return NextResponse.json({
    ...result,
    categories,
    creators,
  });
}
