"use client";

import React, { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { EnoxLogo } from "@/components/EnoxLogo";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErr("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErr(data.error || "Could not send message.");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setErr("Network error.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-[#33312E]/12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5" />
              <span>Reader Support &amp; Inquiries</span>
            </span>
            <h1 className="text-3xl font-extrabold text-[#262421] mt-2">
              Contact ENOX Editorial Desk
            </h1>
          </div>
          <EnoxLogo size="sm" />
        </div>

        <p className="text-xs text-[#524F49] leading-relaxed">
          Need assistance with an order, format download, or institutional licensing? Send us a
          message below. (Replace placeholder business address details in Admin Settings prior to
          commercial launch.)
        </p>

        {status === "sent" ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Your message has been logged with the ENOX team.</span>
            </p>
            <p className="text-xs">We respond to reader inquiries within 1–2 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#33312E]/20 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#33312E]/20 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Order support, format question, or publishing inquiry"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#33312E]/20 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Message *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#33312E]/20 text-xs"
              />
            </div>
            {status === "error" && (
              <p className="text-xs font-semibold text-red-700">{err}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass cursor-pointer"
            >
              {status === "loading" ? "Sending..." : "Submit Inquiry"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
