import React from "react";
import Link from "next/link";
import { EnoxLogo } from "@/components/EnoxLogo";
import { BookOpen, Lock, ShieldCheck, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="liquid-glass-strong rounded-3xl p-8 sm:p-12 border border-[#33312E]/12 space-y-6">
        <EnoxLogo size="lg" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#262421] tracking-tight">
          Read. Learn. Grow.
        </h1>
        <p className="text-base text-[#524F49] leading-relaxed">
          <strong>ENOX Ebooks</strong> is a digital reading and technical monograph marketplace
          built for engineers, designers, quantitative researchers, and lifelong learners. We focus
          on high-signal works formatted in DRM-free vector PDF and reflowable EPUB3.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="liquid-glass-cream rounded-2xl p-5 space-y-2">
            <BookOpen className="w-5 h-5 text-[#33312E]" />
            <h2 className="text-sm font-bold text-[#262421]">Editorial Precision</h2>
            <p className="text-xs text-[#524F49] leading-relaxed">
              Every edition includes clean code blocks, crisp vector diagrams, and multi-device
              readability.
            </p>
          </div>
          <div className="liquid-glass-cream rounded-2xl p-5 space-y-2">
            <Lock className="w-5 h-5 text-[#33312E]" />
            <h2 className="text-sm font-bold text-[#262421]">Verified INR Checkout</h2>
            <p className="text-xs text-[#524F49] leading-relaxed">
              Server-validated pricing and cryptographic Razorpay payment verification protect every
              transaction.
            </p>
          </div>
          <div className="liquid-glass-cream rounded-2xl p-5 space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#33312E]" />
            <h2 className="text-sm font-bold text-[#262421]">Protected Ownership</h2>
            <p className="text-xs text-[#524F49] leading-relaxed">
              Purchased ebooks live in your personal ENOX Library with short-lived signed download
              links.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browse the ENOX Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
