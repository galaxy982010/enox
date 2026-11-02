"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Tag,
  Trash2,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { Book, Promotion } from "@/types/enox";

interface ValidatedCartState {
  items: {
    book: Book;
    unitPriceInr: number;
    originalPriceInr: number | null;
    alreadyOwned: boolean;
  }[];
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  appliedPromo: Promotion | null;
  promoError: string | null;
}

export default function CartPage() {
  const router = useRouter();
  const { cartBookIds, removeFromCart, clearCart, user } = useStore();
  const [promoInput, setPromoInput] = useState("ENOX20");
  const [activePromo, setActivePromo] = useState<string | null>(null);
  const [validated, setValidated] = useState<ValidatedCartState | null>(null);
  const [loading, setLoading] = useState(true);

  const syncCartWithServer = useCallback(
    async (codeToApply: string | null) => {
      if (cartBookIds.length === 0) {
        setValidated(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookIds: cartBookIds,
            promoCode: codeToApply,
          }),
        });
        const data = await res.json();
        setValidated(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [cartBookIds]
  );

  useEffect(() => {
    syncCartWithServer(activePromo);
  }, [syncCartWithServer, activePromo]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePromo(promoInput.trim() || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 border border-[#33312E]/12 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Digital Shopping Bag</span>
          </span>
          <h1 className="text-3xl font-extrabold text-[#262421] mt-2">
            Your Cart ({cartBookIds.length})
          </h1>
        </div>
        {cartBookIds.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-[#524F49] hover:text-red-700 underline cursor-pointer"
          >
            Clear Bag
          </button>
        )}
      </div>

      {cartBookIds.length === 0 ? (
        <div className="liquid-glass-strong rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE9DA] text-[#33312E] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#262421]">
            Your shopping bag is empty
          </h2>
          <p className="text-xs text-[#524F49] max-w-md mx-auto">
            Explore our catalog of digital monographs in Systems Architecture, Design, Applied AI,
            and Quantitative Economics.
          </p>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : loading && !validated ? (
        <div className="py-12 text-center text-sm text-[#524F49]">
          Validating prices &amp; availability on server...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {validated?.items.map((item) => (
              <div
                key={item.book.id}
                className="liquid-glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.book.cover_image}
                    alt={item.book.title}
                    className="w-16 h-22 object-contain rounded-lg bg-[#EDE9DA]/50 p-1 shrink-0"
                  />
                  <div className="space-y-1">
                    <Link
                      href={`/books/${item.book.slug}`}
                      className="text-base font-bold text-[#262421] hover:underline"
                    >
                      {item.book.title}
                    </Link>
                    <p className="text-xs text-[#524F49]">
                      By {item.book.author} · Formats: {item.book.formats.join(", ")}
                    </p>
                    <p className="text-[11px] text-[#78746C]">
                      Personal Digital License (Qty: 1 — single copy rule enforced)
                    </p>
                    {item.alreadyOwned && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        Already owned in your ENOX Library — excluded from payable total
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#33312E]/10">
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#262421]">
                      ₹{item.unitPriceInr.toLocaleString("en-IN")}
                    </span>
                    {item.originalPriceInr && item.originalPriceInr > item.unitPriceInr && (
                      <span className="block text-xs text-[#78746C] line-through">
                        ₹{item.originalPriceInr.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.book.id)}
                    aria-label={`Remove ${item.book.title} from cart`}
                    className="p-2 rounded-xl text-[#524F49] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Server Summary & Promo Code */}
          <aside className="lg:col-span-4 liquid-glass-strong rounded-3xl p-6 space-y-6 border border-[#33312E]/15">
            <h2 className="text-base font-extrabold text-[#262421]">
              Server-Validated Summary
            </h2>

            {/* Promo Form */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#524F49]">
                Privilege / Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="ENOX20 or READ150"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#33312E]/20 text-xs font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold btn-secondary-glass cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {validated?.appliedPromo && (
                <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    Applied {validated.appliedPromo.code}: -₹
                    {validated.discountInr.toLocaleString("en-IN")}
                  </span>
                </p>
              )}
              {validated?.promoError && (
                <p className="text-xs font-semibold text-red-700">{validated.promoError}</p>
              )}
            </form>

            {/* Totals */}
            <div className="space-y-2.5 pt-4 border-t border-[#33312E]/10 text-sm">
              <div className="flex justify-between text-[#524F49]">
                <span>Subtotal (Server Prices)</span>
                <span className="font-semibold text-[#262421]">
                  ₹{(validated?.subtotalInr || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-[#524F49]">
                <span>Promotional Discount</span>
                <span className="font-semibold text-emerald-800">
                  -₹{(validated?.discountInr || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#262421] pt-3 border-t border-[#33312E]/10">
                <span>Payable Total (INR)</span>
                <span>₹{(validated?.totalInr || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    activePromo
                      ? `/checkout?promo=${encodeURIComponent(activePromo)}`
                      : "/checkout"
                  )
                }
                className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to Secure Checkout</span>
              </button>
            ) : (
              <Link
                href="/login?next=/checkout"
                className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Checkout</span>
              </Link>
            )}

            <div className="text-[11px] text-[#78746C] space-y-1">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#33312E]" />
                <span>Prices and discounts are strictly verified on the server.</span>
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
