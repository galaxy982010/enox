import React from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How do I download my purchased ebooks?",
    a: "Immediately after your Razorpay payment in INR is verified on the server, your purchased titles appear in Account → Purchased Library. Click 'Download PDF' or 'Download EPUB' to generate a short-lived (5-minute) cryptographically signed download link.",
  },
  {
    q: "Are ENOX ebooks DRM-free?",
    a: "Yes. Purchased editions are provided in standard PDF and/or EPUB formats for your personal reading across desktop, tablet, and e-reader devices without proprietary reader lock-in.",
  },
  {
    q: "Why are some titles marked 'Demo Edition'?",
    a: "Until commercial catalog files are uploaded via the ENOX Admin Console, curated sample titles are explicitly badged as 'Demo Edition' so visitors can distinguish demonstration entries from commercial releases.",
  },
  {
    q: "Who can post a book review on ENOX?",
    a: "Only authenticated readers who actively own the ebook in their ENOX Library can submit a review. Our server rejects review submissions from non-purchasers.",
  },
  {
    q: "What happens if an order is refunded?",
    a: "When an order is refunded via Admin action or a Razorpay refund.processed webhook, the order transitions to 'refunded' and library download access for that order is automatically revoked.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="liquid-glass-strong rounded-3xl p-8 border border-[#33312E]/12 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </span>
        <h1 className="text-3xl font-extrabold text-[#262421]">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="space-y-4">
        {FAQS.map((item, idx) => (
          <div key={idx} className="liquid-glass-card p-6 space-y-2">
            <h2 className="text-base font-bold text-[#262421]">{item.q}</h2>
            <p className="text-xs text-[#524F49] leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-[#524F49]">
        Still have questions?{" "}
        <Link href="/contact" className="font-bold text-[#262421] underline">
          Contact the ENOX Support Desk
        </Link>
      </div>
    </div>
  );
}
