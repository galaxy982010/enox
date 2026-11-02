"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="liquid-glass-strong rounded-3xl p-10 space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#EDE9DA] text-[#33312E] mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#262421]">
          Something interrupted the page render
        </h1>
        <p className="text-sm text-[#524F49]">
          {error.message || "An unexpected client or server error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-primary-glass inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-secondary-glass"
          >
            Storefront Home
          </Link>
        </div>
      </div>
    </div>
  );
}
