"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import type { WishlistItem } from "@/types/enox";
import { useStore } from "@/context/StoreContext";
import { BookCard } from "@/components/BookCard";

export default function WishlistPage() {
  const { user, authLoading, wishlistBookIds } = useStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.wishlist || []))
      .finally(() => setLoading(false));
  }, [user, authLoading, wishlistBookIds]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="liquid-glass-strong rounded-3xl p-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE9DA] text-[#33312E] mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262421]">
            Sign in to view your saved wishlist
          </h1>
          <p className="text-xs text-[#524F49] max-w-md mx-auto">
            Your wishlist is synced to your personal ENOX account so you can curate future reads
            across devices.
          </p>
          <div className="pt-2">
            <Link
              href="/login?next=/wishlist"
              className="px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass inline-flex items-center gap-2"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 border border-[#33312E]/12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5" />
          <span>Personal Reading List</span>
        </span>
        <h1 className="text-3xl font-extrabold text-[#262421] mt-2">
          Saved Wishlist ({items.length})
        </h1>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#524F49]">
          Loading your wishlist...
        </div>
      ) : items.length === 0 ? (
        <div className="liquid-glass-strong rounded-3xl p-12 text-center space-y-4">
          <p className="text-base font-bold text-[#262421]">
            Your wishlist is currently empty.
          </p>
          <p className="text-xs text-[#524F49]">
            Click the heart icon on any monograph card to save it here for later.
          </p>
          <Link
            href="/books"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold btn-primary-glass"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((w) => (w.book ? <BookCard key={w.id} book={w.book} /> : null))}
        </div>
      )}
    </div>
  );
}
