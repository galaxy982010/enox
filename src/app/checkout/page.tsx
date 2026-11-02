"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { Book, Order, Promotion } from "@/types/enox";
import { EnoxLogo } from "@/components/EnoxLogo";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

interface CheckoutCartSummary {
  purchasableItems: { book: Book; unitPriceInr: number }[];
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  appliedPromo: Promotion | null;
  promoError: string | null;
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPromo = searchParams.get("promo") || "ENOX20";
  const { user, authLoading, cartBookIds, clearCart, refreshSession, showToast } =
    useStore();

  const [promoCode, setPromoCode] = useState(initialPromo);
  const [summary, setSummary] = useState<CheckoutCartSummary | null>(null);
  const [rzpStatus, setRzpStatus] = useState<{
    razorpayLiveConfigured: boolean;
    webhookSecretConfigured: boolean;
    qaSandboxAvailable: boolean;
    missingVariables: string[];
  } | null>(null);

  const [step, setStep] = useState<
    "review" | "processing" | "qa_verify" | "success" | "failed"
  >("review");
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [qaCredentials, setQaCredentials] = useState<{
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCheckoutData = useCallback(async () => {
    if (cartBookIds.length === 0) return;
    const [cartRes, cfgRes] = await Promise.all([
      fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookIds: cartBookIds, promoCode }),
      }),
      fetch("/api/checkout/create-order"),
    ]);
    if (cartRes.ok) {
      setSummary(await cartRes.json());
    }
    if (cfgRes.ok) {
      setRzpStatus(await cfgRes.json());
    }
  }, [cartBookIds, promoCode]);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="liquid-glass-strong rounded-3xl p-10 space-y-5">
          <div className="flex justify-center">
            <EnoxLogo size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262421]">
            Authentication required for checkout
          </h1>
          <p className="text-xs text-[#524F49]">
            Please sign in or create an ENOX account so your purchased ebooks can be permanently
            bound to your personal library.
          </p>
          <Link
            href="/login?next=/checkout"
            className="inline-block px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const handleInitiateCheckout = async (useQaSandbox: boolean) => {
    setStep("processing");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIds: cartBookIds,
          promoCode,
          useQaSignatureSandbox: useQaSandbox,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Could not create checkout order.");
        setStep("failed");
        return;
      }

      setPendingOrder(data.order);

      // Live Razorpay Modal Flow
      if (data.mode === "razorpay_live" && data.keyId) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          if (!window.Razorpay) {
            setErrorMsg("Failed to load Razorpay Checkout SDK.");
            setStep("failed");
            return;
          }
          const rzp = new window.Razorpay({
            key: data.keyId,
            amount: data.amountPaise,
            currency: "INR",
            name: "ENOX Ebooks",
            description: `Order ${data.order.order_number}`,
            order_id: data.razorpayOrderId,
            prefill: {
              name: user?.full_name,
              email: user?.email,
            },
            theme: { color: "#33312E" },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              await verifyServerSignature(response, false);
            },
          });
          rzp.open();
        };
        document.body.appendChild(script);
        return;
      }

      // QA Cryptographic Signature Verification Sandbox Flow
      if (data.mode === "qa_signature_sandbox" && data.qaTestCredentials) {
        setQaCredentials(data.qaTestCredentials);
        setStep("qa_verify");
      }
    } catch {
      setErrorMsg("Network error while creating order.");
      setStep("failed");
    }
  };

  const verifyServerSignature = async (
    creds: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    simulateFailure = false
  ) => {
    setStep("processing");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          simulate_failure: simulateFailure,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setErrorMsg(
          data.error || "Payment verification failed. Ebook ownership was not granted."
        );
        setStep("failed");
        return;
      }
      setPendingOrder(data.order);
      clearCart();
      await refreshSession();
      setStep("success");
      showToast(
        "Payment Verified",
        `Order ${data.order.order_number} confirmed. Your ebooks are unlocked!`,
        "success"
      );
    } catch {
      setErrorMsg("Error communicating with verification endpoint.");
      setStep("failed");
    }
  };

  if (step === "success" && pendingOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="liquid-glass-strong rounded-3xl p-8 sm:p-10 border border-emerald-300 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#262421]">
            Payment Verified &amp; Ebooks Unlocked
          </h1>
          <p className="text-xs text-[#524F49]">
            Order <strong className="text-[#262421]">{pendingOrder.order_number}</strong> (₹
            {pendingOrder.total_inr.toLocaleString("en-IN")}) has been cryptographically verified on
            the server.
          </p>
          <div className="p-4 rounded-2xl bg-[#EDE9DA]/60 text-left text-xs space-y-1.5">
            <p>
              <strong>Razorpay Order ID:</strong>{" "}
              <code className="font-mono">{pendingOrder.razorpay_order_id}</code>
            </p>
            <p>
              <strong>Razorpay Payment ID:</strong>{" "}
              <code className="font-mono">{pendingOrder.razorpay_payment_id}</code>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="uppercase font-bold text-emerald-800">
                {pendingOrder.status} / {pendingOrder.payment_status}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/account?tab=library"
              className="px-6 py-3 rounded-xl text-xs font-semibold btn-primary-glass"
            >
              Download Ebooks in Library
            </Link>
            <Link
              href="/account?tab=orders"
              className="px-6 py-3 rounded-xl text-xs font-semibold btn-secondary-glass"
            >
              View Order Receipt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 border border-[#33312E]/12 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full enox-cream-badge text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted INR Checkout</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#262421] mt-2">
            Complete Your Order
          </h1>
        </div>
        <EnoxLogo size="sm" />
      </div>

      {/* Razorpay Configuration Status Banner */}
      {rzpStatus && !rzpStatus.razorpayLiveConfigured && (
        <div className="liquid-glass-cream rounded-3xl p-6 border border-[#33312E]/20 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-extrabold text-[#262421]">
                Razorpay Live Credentials Not ConfiguredYet
              </h2>
              <p className="text-xs text-[#524F49] leading-relaxed">
                Missing environment variables:{" "}
                <code className="font-mono font-bold text-[#262421]">
                  {rzpStatus.missingVariables.join(", ")}
                </code>
                . In accordance with ENOX security policy, live Razorpay Checkout is disabled until
                you add your keys to <code className="font-mono">.env.local</code>. For QA &amp;
                development testing, you can use the{" "}
                <strong>Cryptographic HMAC-SHA256 Signature Verification Sandbox</strong> below to
                test pending order creation, real HMAC signature verification, failure handling, and
                library ownership unlock.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "qa_verify" && pendingOrder && qaCredentials && (
        <div className="liquid-glass-strong rounded-3xl p-6 sm:p-8 border border-[#33312E]/20 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#33312E]">
            <Terminal className="w-4 h-4" />
            <span>QA Cryptographic Signature Verification Step</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#262421]">
            Pending Order Created: {pendingOrder.order_number} (₹
            {pendingOrder.total_inr.toLocaleString("en-IN")})
          </h2>
          <p className="text-xs text-[#524F49]">
            The server created a pending order (`status: &quot;pending&quot;`) and computed a real
            HMAC-SHA256 signature for `razorpay_order_id|razorpay_payment_id`. Choose an action to
            test server-side verification:
          </p>
          <div className="p-4 rounded-2xl bg-[#EDE9DA]/60 font-mono text-xs space-y-1.5 overflow-x-auto">
            <div>razorpay_order_id: {qaCredentials.razorpay_order_id}</div>
            <div>razorpay_payment_id: {qaCredentials.razorpay_payment_id}</div>
            <div>razorpay_signature: {qaCredentials.razorpay_signature}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => verifyServerSignature(qaCredentials, false)}
              className="px-5 py-3 rounded-xl text-xs font-semibold btn-primary-glass inline-flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Valid HMAC Signature &amp; Unlock Ebooks</span>
            </button>
            <button
              type="button"
              onClick={() =>
                verifyServerSignature(
                  { ...qaCredentials, razorpay_signature: "tampered_invalid_signature_0000" },
                  false
                )
              }
              className="px-5 py-3 rounded-xl text-xs font-semibold btn-secondary-glass cursor-pointer"
            >
              Test Tampered Signature Rejection
            </button>
            <button
              type="button"
              onClick={() => verifyServerSignature(qaCredentials, true)}
              className="px-5 py-3 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 cursor-pointer"
            >
              Simulate Payment Failure
            </button>
          </div>
        </div>
      )}

      {step === "failed" && (
        <div className="liquid-glass-strong rounded-3xl p-6 border border-red-300 bg-red-50/80 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-900">
            <XCircle className="w-5 h-5 text-red-700" />
            <span>Payment Verification Failed</span>
          </div>
          <p className="text-xs text-red-800">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setStep("review")}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold btn-primary-glass cursor-pointer"
          >
            Retry Checkout
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="liquid-glass-strong rounded-3xl p-6 space-y-4 border border-[#33312E]/12">
              <h2 className="text-base font-extrabold text-[#262421]">
                Customer &amp; Delivery Account
              </h2>
              <div className="text-xs text-[#524F49] space-y-1">
                <p>
                  <strong>Reader:</strong> {user?.full_name}
                </p>
                <p>
                  <strong>Delivery Email &amp; Library Account:</strong> {user?.email}
                </p>
              </div>
            </div>

            <div className="liquid-glass-strong rounded-3xl p-6 space-y-4 border border-[#33312E]/12">
              <h2 className="text-base font-extrabold text-[#262421]">
                Order Items ({summary?.purchasableItems.length || 0})
              </h2>
              {summary?.purchasableItems.map((item) => (
                <div
                  key={item.book.id}
                  className="flex items-center justify-between gap-4 py-2 border-b border-[#33312E]/10 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-bold text-[#262421]">{item.book.title}</p>
                    <p className="text-xs text-[#524F49]">
                      {item.book.author} · {item.book.formats.join(" + ")}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[#262421]">
                    ₹{item.unitPriceInr.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 liquid-glass-strong rounded-3xl p-6 space-y-5 border border-[#33312E]/15">
            <h2 className="text-base font-extrabold text-[#262421]">
              Payment Summary (INR)
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#33312E]/20 text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={loadCheckoutData}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-secondary-glass cursor-pointer"
              >
                Recalculate
              </button>
            </div>

            <div className="space-y-2 text-sm pt-2 border-t border-[#33312E]/10">
              <div className="flex justify-between text-[#524F49]">
                <span>Subtotal</span>
                <span>₹{(summary?.subtotalInr || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Discount</span>
                <span>-₹{(summary?.discountInr || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-lg font-extrabold text-[#262421] pt-2 border-t border-[#33312E]/10">
                <span>Total Payable</span>
                <span>₹{(summary?.totalInr || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {rzpStatus?.razorpayLiveConfigured ? (
              <button
                type="button"
                onClick={() => handleInitiateCheckout(false)}
                className="w-full py-3.5 rounded-xl text-sm font-semibold btn-primary-glass flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  Pay ₹{(summary?.totalInr || 0).toLocaleString("en-IN")} with Razorpay
                </span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleInitiateCheckout(false)}
                  className="w-full py-3 rounded-xl text-xs font-semibold btn-secondary-glass cursor-pointer"
                >
                  Check Live Razorpay Gateway Status
                </button>
                {rzpStatus?.qaSandboxAvailable && (
                  <button
                    type="button"
                    onClick={() => handleInitiateCheckout(true)}
                    className="w-full py-3.5 rounded-xl text-xs font-semibold btn-primary-glass flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>
                      Run QA HMAC-SHA256 Verified Checkout (₹
                      {(summary?.totalInr || 0).toLocaleString("en-IN")})
                    </span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="w-full text-center text-xs text-[#524F49] underline cursor-pointer"
            >
              Return to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm">Loading checkout...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
