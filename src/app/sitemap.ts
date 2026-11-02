import type { MetadataRoute } from "next";
import { getPublishedBooks } from "@/lib/db/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { books } = getPublishedBooks({ pageSize: 100 });

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/books",
    "/about",
    "/contact",
    "/faq",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refund-policy",
    "/legal/download-policy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: new Date(book.updated_at),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...bookRoutes];
}
