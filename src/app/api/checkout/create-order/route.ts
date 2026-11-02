import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSessionUser } from "@/lib/auth/session";
import { createServerPendingOrder, validateCartOnServer } from "@/lib/db/store";
import {
  computeRazorpayPaymentSignature,
  getRazorpayEffectiveSecret,
} from "@/lib/security/crypto";

export async function GET() {
  const cfg = getRazorpayEffectiveSecret();
  return NextResponse.json({
    razorpayLiveConfigured: cfg.isLiveConfigured,
    webhookSecretConfigured: Boolean(cfg.webhookSecret),
    qaSandboxAvailable: cfg.qaSandboxEnabled,
    missingVariables: [
      !cfg.keyId ? "RAZORPAY_KEY_ID" : null,
      !cfg.keySecret ? "RAZORPAY_KEY_SECRET" : null,
      !cfg.webhookSecret ? "RAZORPAY_WEBHOOK_SECRET" : null,
    ].filter(Boolean),
  });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication is required before initiating checkout." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const bookIds = Array.isArray(body.bookIds) ? body.bookIds.map(String) : [];
    const promoCode = typeof body.promoCode === "string" ? body.promoCode : null;
    const useQaSignatureSandbox = Boolean(body.useQaSignatureSandbox);

    // 1. Validate availability, ownership, and server-side prices
    const validated = validateCartOnServer({
      bookIds,
      promoCode,
      userId: user.id,
    });

    if (validated.unavailableBookIds.length > 0) {
      return NextResponse.json(
        { error: "One or more ebooks in your cart are unavailable." },
        { status: 400 }
      );
    }
    if (validated.alreadyOwnedBookIds.length > 0 && validated.purchasableItems.length === 0) {
      return NextResponse.json(
        { error: "You already own all selected ebooks in your ENOX Library." },
        { status: 409 }
      );
    }
    if (validated.purchasableItems.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    const cfg = getRazorpayEffectiveSecret();

    // 2. If live Razorpay credentials are configured, create a real Razorpay Order via Razorpay API
    if (cfg.isLiveConfigured && cfg.keyId && cfg.keySecret && !useQaSignatureSandbox) {
      const amountPaise = Math.round(validated.totalInr * 100);
      const authHeader = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64");
      const receipt = `enox_${Date.now()}`;

      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            user_id: user.id,
            customer_email: user.email,
            promo_code: validated.appliedPromo?.code || "",
          },
        }),
      });

      if (!rzpResponse.ok) {
        const errText = await rzpResponse.text();
        return NextResponse.json(
          {
            error: "Razorpay gateway rejected order creation. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            providerDetails: errText.slice(0, 200),
          },
          { status: 502 }
        );
      }

      const rzpOrder = (await rzpResponse.json()) as { id: string; amount: number; currency: string };
      const created = createServerPendingOrder({
        userId: user.id,
        bookIds: validated.purchasableItems.map((i) => i.book.id),
        promoCode: validated.appliedPromo?.code || null,
        razorpayOrderId: rzpOrder.id,
      });

      if (created.error || !created.order) {
        return NextResponse.json({ error: created.error || "Order creation failed." }, { status: 400 });
      }

      return NextResponse.json({
        mode: "razorpay_live",
        order: created.order,
        razorpayOrderId: rzpOrder.id,
        amountPaise: rzpOrder.amount,
        currency: "INR",
        keyId: cfg.keyId,
      });
    }

    // 3. If live Razorpay credentials are NOT configured and developer QA sandbox was NOT explicitly requested:
    // Block live checkout transparently and return configuration setup guide.
    if (!useQaSignatureSandbox || !cfg.qaSandboxEnabled) {
      return NextResponse.json(
        {
          code: "RAZORPAY_CREDENTIALS_MISSING",
          error:
            "Razorpay live credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured on the server.",
          setupGuide: {
            step1: "Create a Razorpay account and generate API keys in Test or Live mode.",
            step2: "Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET to .env.local.",
            step3: "Restart the Next.js server to enable live Razorpay Checkout.",
          },
          qaSandboxAvailable: cfg.qaSandboxEnabled,
        },
        { status: 503 }
      );
    }

    // 4. Explicit QA Cryptographic Signature Verification Sandbox (non-production only)
    const qaOrderId = `order_qa_${crypto.randomBytes(8).toString("hex")}`;
    const created = createServerPendingOrder({
      userId: user.id,
      bookIds: validated.purchasableItems.map((i) => i.book.id),
      promoCode: validated.appliedPromo?.code || null,
      razorpayOrderId: qaOrderId,
    });

    if (created.error || !created.order) {
      return NextResponse.json({ error: created.error || "Order creation failed." }, { status: 400 });
    }

    const qaPaymentId = `pay_qa_${crypto.randomBytes(8).toString("hex")}`;
    const qaSignature = computeRazorpayPaymentSignature(
      qaOrderId,
      qaPaymentId,
      cfg.qaSandboxSecret
    );

    return NextResponse.json({
      mode: "qa_signature_sandbox",
      notice:
        "QA Cryptographic Sandbox Mode — Live Razorpay keys are not set. Use the generated HMAC-SHA256 test payload to verify the signature & webhook pipeline.",
      order: created.order,
      razorpayOrderId: qaOrderId,
      amountPaise: Math.round(created.order.total_inr * 100),
      currency: "INR",
      qaTestCredentials: {
        razorpay_order_id: qaOrderId,
        razorpay_payment_id: qaPaymentId,
        razorpay_signature: qaSignature,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating checkout order." },
      { status: 500 }
    );
  }
}
