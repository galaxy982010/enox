import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalPageBySlug, getAllLegalPages } from "@/lib/db/store";
import { FileCheck2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LegalPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLegalPageBySlug(slug);
  if (!page) {
    notFound();
  }
  const allPages = getAllLegalPages();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-[#33312E]/12 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Official Policy Document</span>
          </span>
          <span className="text-xs text-[#78746C]">
            Last updated: {page.last_updated}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-[#262421]">{page.title}</h1>
        <p className="text-sm text-[#524F49]">{page.subtitle}</p>

        {/* Policy Switcher */}
        <div className="flex flex-wrap gap-2 pt-2">
          {allPages.map((p) => (
            <Link
              key={p.slug}
              href={`/legal/${p.slug}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                p.slug === page.slug ? "btn-primary-glass" : "btn-secondary-glass"
              }`}
            >
              {p.title}
            </Link>
          ))}
        </div>
      </div>

      <article className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-[#33312E]/12 space-y-4">
        {page.content_markdown.split("\n\n").map((block, idx) => {
          if (block.startsWith("## ")) {
            return (
              <h2
                key={idx}
                className="text-lg font-extrabold text-[#262421] pt-3 first:pt-0"
              >
                {block.replace("## ", "")}
              </h2>
            );
          }
          return (
            <p key={idx} className="text-sm text-[#524F49] leading-relaxed whitespace-pre-line">
              {block}
            </p>
          );
        })}
      </article>
    </div>
  );
}
