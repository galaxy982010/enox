"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { EnoxLogo } from "@/components/EnoxLogo";
import { useStore } from "@/context/StoreContext";

export default function SignupPage() {
  const router = useRouter();
  const { refreshSession, showToast } = useStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          newsletterConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        return;
      }
      await refreshSession();
      showToast(
        "Account Created",
        `Welcome to ENOX Ebooks, ${data.user.full_name}!`,
        "success"
      );
      router.push("/account");
    } catch {
      setError("Network error while creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-[#33312E]/15 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center py-1">
            <EnoxLogo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262421] tracking-tight">
            Create your ENOX account
          </h1>
          <p className="text-xs text-[#524F49]">
            Build your permanent digital library with instant PDF &amp; EPUB access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5"
            >
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aarav Sharma"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421]"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421]"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5"
            >
              Password (minimum 8 characters)
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421]"
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#524F49] cursor-pointer">
            <input
              type="checkbox"
              checked={newsletterConsent}
              onChange={(e) => setNewsletterConsent(e.target.checked)}
              className="mt-0.5 rounded border-[#33312E]/30 text-[#33312E]"
            />
            <span>
              Send me fortnightly ENOX editorial releases and sample chapters (optional).
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Creating Account..." : "Create Reader Account"}</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#524F49] pt-2">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#262421] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
