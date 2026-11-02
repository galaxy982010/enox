import React from "react";
import Link from "next/link";
import { EnoxLogo } from "./EnoxLogo";
import { Sparkles, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#E8E1D6] bg-gradient-to-b from-[#EDE9DA]/70 to-[#F7F3EB] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <EnoxLogo size="md" />
            <p className="max-w-sm text-sm leading-relaxed text-[#524F49]">
              ENOX Ebooks is a curated digital products marketplace where creators publish ebooks,
              study guides, templates, and resources for readers worldwide.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="badge-olive-glass inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-[#7C8665]" />
                <span>DRM-Free PDF &amp; EPUB</span>
              </span>
              <span className="badge-gold-glass inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-[#B89455]" />
                <span>Up to 80% Creator Share</span>
              </span>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292929]">
              Marketplace
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#524F49]">
              <li>
                <Link href="/books" className="hover:text-[#7C8665] transition-colors">
                  Discover All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/books?category=ebooks-guides"
                  className="hover:text-[#7C8665] transition-colors"
                >
                  Ebooks &amp; Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/books?category=study-resources"
                  className="hover:text-[#7C8665] transition-colors"
                >
                  Study Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/books?category=templates"
                  className="hover:text-[#7C8665] transition-colors"
                >
                  Templates &amp; Kits
                </Link>
              </li>
              <li>
                <Link
                  href="/books?category=ai-prompts"
                  className="hover:text-[#7C8665] transition-colors"
                >
                  AI Prompts &amp; Planners
                </Link>
              </li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292929]">
              Creators
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#524F49]">
              <li>
                <Link href="/creator" className="hover:text-[#7C8665] transition-colors">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/creator?tab=add-product"
                  className="hover:text-[#7C8665] transition-colors"
                >
                  Upload a Product
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#B89455] transition-colors">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#7C8665] transition-colors">
                  Creator FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292929]">
              Company &amp; Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#524F49]">
              <li>
                <Link href="/about" className="hover:text-[#7C8665] transition-colors">
                  About ENOX
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#7C8665] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#7C8665] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-[#7C8665] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="hover:text-[#7C8665] transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E8E1D6] pt-8 sm:flex-row text-xs text-[#77736D]">
          <p>© {new Date().getFullYear()} ENOX Ebooks. All rights reserved.</p>
          <p>Instant digital delivery · Transparent creator payouts in INR (₹)</p>
        </div>
      </div>
    </footer>
  );
}
