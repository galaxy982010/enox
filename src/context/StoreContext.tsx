"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Book, UserProfile } from "@/types/enox";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "info" | "success" | "error";
}

interface StoreContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  cartBookIds: string[];
  wishlistBookIds: string[];
  libraryBookIds: string[];
  addToCart: (book: Book) => boolean;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  isInCart: (bookId: string) => boolean;
  isOwned: (bookId: string) => boolean;
  isWishlisted: (bookId: string) => boolean;
  toggleWishlist: (book: Book) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  showToast: (title: string, description?: string, variant?: "info" | "success" | "error") => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "enox_cart_book_ids_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartBookIds, setCartBookIds] = useState<string[]>([]);
  const [wishlistBookIds, setWishlistBookIds] = useState<string[]>([]);
  const [libraryBookIds, setLibraryBookIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      variant: "info" | "success" | "error" = "info"
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setLibraryBookIds(Array.isArray(data.libraryBookIds) ? data.libraryBookIds : []);
        setWishlistBookIds(Array.isArray(data.wishlistBookIds) ? data.wishlistBookIds : []);
      }
    } catch {
      // ignore offline error
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartBookIds(Array.from(new Set(parsed.map(String))));
        }
      }
    } catch {
      // ignore storage errors
    }
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartBookIds));
    } catch {
      // ignore
    }
  }, [cartBookIds]);

  const isInCart = useCallback(
    (bookId: string) => cartBookIds.includes(bookId),
    [cartBookIds]
  );

  const isOwned = useCallback(
    (bookId: string) => libraryBookIds.includes(bookId),
    [libraryBookIds]
  );

  const isWishlisted = useCallback(
    (bookId: string) => wishlistBookIds.includes(bookId),
    [wishlistBookIds]
  );

  const addToCart = useCallback(
    (book: Book): boolean => {
      if (libraryBookIds.includes(book.id)) {
        showToast(
          "Already in your ENOX Library",
          `"${book.title}" is already owned and ready for instant download.`,
          "info"
        );
        return false;
      }
      if (cartBookIds.includes(book.id)) {
        showToast(
          "Already in Cart",
          `"${book.title}" is already in your shopping bag (digital editions are limited to 1 license per order).`,
          "info"
        );
        return false;
      }
      setCartBookIds((prev) => [...prev, book.id]);
      showToast(
        "Added to Cart",
        `"${book.title}" (₹${book.price_inr.toLocaleString("en-IN")}) added to your bag.`,
        "success"
      );
      return true;
    },
    [cartBookIds, libraryBookIds, showToast]
  );

  const removeFromCart = useCallback(
    (bookId: string) => {
      setCartBookIds((prev) => prev.filter((id) => id !== bookId));
      showToast("Removed from Cart", "Item removed from your shopping bag.", "info");
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setCartBookIds([]);
  }, []);

  const toggleWishlist = useCallback(
    async (book: Book) => {
      if (!user) {
        showToast(
          "Sign in Required",
          "Please sign in to save titles to your personal wishlist.",
          "error"
        );
        return;
      }
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("Wishlist Error", data.error || "Could not update wishlist.", "error");
          return;
        }
        if (data.inWishlist) {
          setWishlistBookIds((prev) => Array.from(new Set([...prev, book.id])));
          showToast("Saved to Wishlist", `"${book.title}" saved to your reading list.`, "success");
        } else {
          setWishlistBookIds((prev) => prev.filter((id) => id !== book.id));
          showToast("Removed from Wishlist", `"${book.title}" removed from wishlist.`, "info");
        }
      } catch {
        showToast("Network Error", "Could not update wishlist.", "error");
      }
    },
    [user, showToast]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setLibraryBookIds([]);
    setWishlistBookIds([]);
    showToast("Signed Out", "You have been securely signed out of ENOX.", "info");
  }, [showToast]);

  return (
    <StoreContext.Provider
      value={{
        user,
        authLoading,
        cartBookIds,
        wishlistBookIds,
        libraryBookIds,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        isOwned,
        isWishlisted,
        toggleWishlist,
        refreshSession,
        logout,
        showToast,
      }}
    >
      {children}

      {/* Liquid Glass Toast Notification Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto liquid-glass-strong rounded-2xl p-4 border shadow-lg transition-all ${
              t.variant === "error"
                ? "border-red-300/80 bg-red-50/90 text-red-950"
                : t.variant === "success"
                  ? "border-blue-300/80 bg-white/92 text-slate-900"
                  : "border-slate-200/90 bg-white/90 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <span
                className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                  t.variant === "error"
                    ? "bg-red-600"
                    : t.variant === "success"
                      ? "bg-blue-600"
                      : "bg-slate-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
