"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { EnoxLogo } from "@/components/EnoxLogo";
import { useStore } from "@/context/StoreContext";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/account";
  const { refreshSession, showToast } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      await refreshSession();
      showToast("Welcome back", `Signed in as ${data.user.full_name}`, "success");
      router.push(data.user.role === "admin" && nextUrl === "/account" ? "/admin" : nextUrl);
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role: "reader" | "admin") => {
    if (role === "admin") {
      setEmail("admin@enox.store");
      setPassword("EnoxAdmin!2026");
    } else {
      setEmail("reader@enox.store");
      setPassword("EnoxReader!2026");
    }
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-[#33312E]/15 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center py-1">
            <EnoxLogo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262421] tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-xs text-[#524F49]">
            Access your purchased digital library, order receipts, and saved reading list.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@enox.store"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-bold uppercase tracking-wider text-[#262421]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#524F49] hover:text-[#262421] underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm text-[#262421]"
            />
          </div>

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
            <Lock className="w-4 h-4" />
            <span>{loading ? "Signing In..." : "Sign In"}</span>
          </button>
        </form>

        {/* Quick Pre-Seeded Test Accounts for QA Verification */}
        <div className="pt-4 border-t border-[#33312E]/10 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#524F49] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Quick QA Test Accounts</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount("reader")}
              className="p-2.5 rounded-xl text-left bg-[#EDE9DA]/60 hover:bg-[#EDE9DA] border border-[#33312E]/15 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-[#262421] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Verified Reader
              </span>
              <span className="text-[10px] text-[#524F49] block truncate">
                reader@enox.store
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("admin")}
              className="p-2.5 rounded-xl text-left bg-[#EDE9DA]/60 hover:bg-[#EDE9DA] border border-[#33312E]/15 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-[#262421] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Curator
              </span>
              <span className="text-[10px] text-[#524F49] block truncate">
                admin@enox.store
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#524F49] pt-2">
          New to ENOX Ebooks?{" "}
          <Link href="/signup" className="font-bold text-[#262421] underline">
            Create a reader account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm">Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
