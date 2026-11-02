import React from "react";
import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, HelpCircle, Sparkles } from "lucide-react";

export const metadata = {
  title: "Creator Subscription Plans — Free & ENOX Premium",
  description:
    "Compare the ENOX Free Creator plan (₹0/month, max 5 listings, 30% commission) and ENOX Premium (₹999/month, max 25 listings, 20% commission).",
};

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">
      {/* Ambient Liquid Glass Orbs */}
      <div
        aria-hidden="true"
        className="animate-orb-slow pointer-events-none absolute -top-12 left-10 h-72 w-72 rounded-full bg-[#7C8665]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-orb-reverse pointer-events-none absolute top-24 right-10 h-80 w-80 rounded-full bg-[#B89455]/22 blur-3xl"
      />

      {/* Page Header */}
      <div className="relative text-center max-w-3xl mx-auto">
        <div className="animate-fade-up liquid-glass-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#292929]">
          <span className="h-2 w-2 rounded-full bg-[#7C8665]" />
          <span>Transparent Creator Economics</span>
        </div>
        <h1 className="animate-fade-up-delay-1 mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-[#292929]">
          Simple Plans Built for Digital Creators
        </h1>
        <p className="animate-fade-up-delay-2 mt-4 text-base sm:text-lg text-[#77736D] leading-relaxed">
          Start publishing for free with zero upfront cost, or upgrade to ENOX Premium as your
          catalog and audience grow.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 items-stretch">
        {/* Plan 1: Free Creator */}
        <div className="liquid-glass-olive rounded-[22px] p-8 sm:p-10 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="badge-olive-glass inline-block rounded-[8px] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  Starter Tier
                </span>
                <h2 className="mt-3 text-2xl font-bold text-[#292929]">Free Creator</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-bold text-[#292929]">₹0</span>
                <span className="block text-xs text-[#77736D]">/month</span>
              </div>
            </div>

            <p className="mt-4 text-sm text-[#524F49] leading-relaxed">
              Everything you need to publish your first ebooks, templates, or study guides with no
              monthly subscription fee.
            </p>

            <div className="my-6 border-t border-[#E8E1D6]" />

            <ul className="space-y-4 text-sm text-[#292929]">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8665]/20 text-[#4F583D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>₹0/month</strong> subscription cost
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8665]/20 text-[#4F583D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  Maximum <strong>5 active product listings</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8665]/20 text-[#4F583D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>30% platform commission</strong> per completed sale (you keep 70%)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8665]/20 text-[#4F583D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>Public creator storefront &amp; DRM-free PDF/EPUB hosting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7C8665]/20 text-[#4F583D]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>Standard sales &amp; earnings ledger</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E8E1D6]">
            <Link
              href="/creator"
              className="btn-olive-glass w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold"
            >
              <span>Start Free Creator Plan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Plan 2: ENOX Premium */}
        <div className="liquid-glass-gold rounded-[22px] p-8 sm:p-10 flex flex-col justify-between relative transition-transform duration-300 hover:-translate-y-1">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="badge-gold-glass inline-flex items-center gap-1 rounded-[8px] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-[#B89455]" />
                  <span>ENOX Premium</span>
                </span>
                <h2 className="mt-3 text-2xl font-bold text-[#292929]">ENOX Premium</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-bold text-[#292929]">₹999</span>
                <span className="block text-xs text-[#77736D]">/month</span>
              </div>
            </div>

            <p className="mt-4 text-sm text-[#524F49] leading-relaxed">
              Designed for established publishers and active creators who want lower commission
              rates, expanded catalog capacity, and deeper analytics.
            </p>

            <div className="my-6 border-t border-[#E8E1D6]" />

            <ul className="space-y-4 text-sm text-[#292929]">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>₹999/month</strong> subscription
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  Maximum <strong>25 active product listings</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  Reduced <strong>20% platform commission</strong> per completed sale (you keep 80%)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>Premium badge</strong> displayed on your creator profile and product pages
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>Eligibility for priority placement</strong> in curated marketplace
                  collections
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>Advanced analytics</strong> (conversion breakdown, category performance,
                  and revenue trends)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B89455] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>Priority support</strong> and faster product review turnaround
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E8E1D6]">
            <Link
              href="/creator?tab=subscription"
              className="btn-gold-glass w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold"
            >
              <span>Manage in Creator Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="liquid-glass-strong rounded-[20px] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E8E1D6] bg-[#EDE9DA]/70">
          <h3 className="text-lg font-bold text-[#292929]">Plan Comparison Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E8E1D6] text-xs uppercase tracking-wider text-[#77736D]">
                <th className="py-4 px-6 font-semibold">Feature</th>
                <th className="py-4 px-6 font-semibold text-[#4F583D]">Free Creator</th>
                <th className="py-4 px-6 font-semibold text-[#7D5D26]">ENOX Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D6] text-[#292929]">
              <tr>
                <td className="py-3.5 px-6 font-medium">Monthly Subscription</td>
                <td className="py-3.5 px-6">₹0/month</td>
                <td className="py-3.5 px-6 font-semibold text-[#7D5D26]">₹999/month</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Active Product Listings</td>
                <td className="py-3.5 px-6">Maximum 5</td>
                <td className="py-3.5 px-6 font-semibold text-[#7D5D26]">Maximum 25</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Platform Commission</td>
                <td className="py-3.5 px-6">30%</td>
                <td className="py-3.5 px-6 font-semibold text-[#287A52]">20%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Creator Net Share</td>
                <td className="py-3.5 px-6">70%</td>
                <td className="py-3.5 px-6 font-semibold text-[#287A52]">80%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Premium Badge</td>
                <td className="py-3.5 px-6 text-[#77736D]">—</td>
                <td className="py-3.5 px-6 font-semibold text-[#7D5D26]">Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Priority Placement Eligibility</td>
                <td className="py-3.5 px-6 text-[#77736D]">Standard catalog indexing</td>
                <td className="py-3.5 px-6 font-semibold text-[#7D5D26]">Eligible for curated slots</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium">Analytics &amp; Support</td>
                <td className="py-3.5 px-6">Standard ledger &amp; support</td>
                <td className="py-3.5 px-6 font-semibold text-[#7D5D26]">
                  Advanced analytics &amp; Priority support
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transparency Note */}
      <div className="liquid-glass-cream rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="h-5 w-5 text-[#7C8665] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#524F49] leading-relaxed">
            <strong className="text-[#292929]">Marketplace Transparency Policy:</strong> ENOX
            Premium provides lower platform commission (20%), up to 25 active listings, a Premium
            badge, and eligibility for priority placement. All rankings and featured placements
            remain editorial and quality-based; plans do not guarantee sales volume or fixed search
            rankings.
          </div>
        </div>
        <Link
          href="/faq"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C8665] hover:underline shrink-0"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Read Creator FAQ</span>
        </Link>
      </div>
    </div>
  );
}
