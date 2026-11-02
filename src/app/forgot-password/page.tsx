"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { EnoxLogo } from "@/components/EnoxLogo";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not request password reset.");
        return;
      }
      if (data.demoResetCode) {
        setDemoCode(data.demoResetCode);
        setToken(data.demoResetCode);
      }
      setStep("confirm");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          email,
          token,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid reset code.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error.");
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
          <h1 className="text-2xl font-extrabold text-[#262421]">
            Reset your password
          </h1>
          <p className="text-xs text-[#524F49]">
            Enter your account email to receive a password reset verification code.
          </p>
        </div>

        {step === "request" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@enox.store"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm"
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass cursor-pointer"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            {demoCode && (
              <div className="p-3 rounded-xl bg-[#EDE9DA] text-xs text-[#262421]">
                <strong>Local Development Reset Code:</strong>{" "}
                <code className="font-mono font-bold">{demoCode}</code>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5">
                Verification Code
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="6-character code"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#262421] mb-1.5">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#33312E]/20 text-sm"
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? "Updating..." : "Set New Password"}</span>
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#262421]">
              Your password has been updated.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass"
            >
              Return to Sign In
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-[#524F49]">
          <Link href="/login" className="underline font-semibold">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
