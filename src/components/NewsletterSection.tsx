"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentGiven: consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Could not subscribe.");
        return;
      }
      setStatus("success");
      setEmail("");
      setConsent(false);
      setMessage("Thank you. You are subscribed to ENOX Ebooks Editorial Dispatches.");
    } catch {
      setStatus("error");
      setMessage("Network error while subscribing.");
    }
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16"
    >
      <div className="liquid-glass-cream rounded-3xl p-8 sm:p-12 border border-[#33312E]/15 relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#33312E] text-[#EDE9DA] text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>ENOX Ebooks Editorial Dispatch</span>
          </div>
          <h2
            id="newsletter-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#262421] tracking-tight"
          >
            Receive new monograph releases &amp; sample chapters.
          </h2>
          <p className="text-sm text-[#524F49] leading-relaxed">
            One curated dispatch every fortnight covering new technical editions, reading notes,
            and subscriber-only INR privileges. Zero spam.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                aria-label="Email address for newsletter"
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421] placeholder:text-[#78746C]"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-3 rounded-xl text-sm font-semibold btn-primary-glass shrink-0 cursor-pointer disabled:opacity-60"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#524F49] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-[#33312E]/30 text-[#33312E] focus:ring-[#33312E]"
              />
              <span>
                I consent to receive editorial emails from ENOX Ebooks in accordance with the{" "}
                <a href="/legal/privacy" className="text-[#262421] font-semibold underline">
                  Privacy Policy
                </a>
                . I can unsubscribe at any time.
              </span>
            </label>

            {status === "success" && (
              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{message}</span>
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="text-xs font-semibold text-red-700 pt-1">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
