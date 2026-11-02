import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { EnoxLogo } from "@/components/EnoxLogo";

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="liquid-glass-strong rounded-3xl p-10 sm:p-14 space-y-6">
        <div className="flex justify-center">
          <EnoxLogo size="lg" />
        </div>
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          404 · Page Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#262421] tracking-tight">
          This chapter is not in our catalog.
        </h1>
        <p className="text-sm text-[#524F49] max-w-md mx-auto leading-relaxed">
          The publication or route you requested may have been moved, archived, or never existed.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/books"
            className="px-6 py-3 rounded-xl text-sm font-semibold btn-primary-glass inline-flex items-center gap-2"
          >
            <span>Browse All Ebooks</span>
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold btn-secondary-glass inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
