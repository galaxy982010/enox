import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import {
  fulfillVerifiedOrderPayment,
  markPaymentFailed,
} from "@/lib/db/store";
import {
  getRazorpayEffectiveSecret,
  verifyRazorpayPaymentSignature,
} from "@/lib/security/crypto";

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to verify payment." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const razorpayOrderId = String(body.razorpay_order_id || "");
    const razorpayPaymentId = String(body.razorpay_payment_id || "");
    const razorpaySignature = String(body.razorpay_signature || "");
    const simulateFailure = Boolean(body.simulate_failure);

    if (!razorpayOrderId) {
      return NextResponse.json(
        { error: "Missing razorpay_order_id." },
        { status: 400 }
      );
    }

    if (simulateFailure) {
      const failedOrder = markPaymentFailed({
        razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || null,
        reason: String(body.failure_reason || "Customer cancelled or bank declined payment"),
      });
      return NextResponse.json(
        {
          verified: false,
          status: "failed",
          order: failedOrder,
          error: "Payment failed or was cancelled. No ownership was granted.",
        },
        { status: 402 }
      );
    }

    if (!razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing razorpay_payment_id or razorpay_signature." },
        { status: 400 }
      );
    }

    const cfg = getRazorpayEffectiveSecret();
    const isQaOrder = razorpayOrderId.startsWith("order_qa_");
    const secretToUse = isQaOrder
      ? cfg.qaSandboxEnabled
        ? cfg.qaSandboxSecret
        : null
      : cfg.keySecret;

    if (!secretToUse) {
      return NextResponse.json(
        { error: "Server payment verification secret is not configured." },
        { status: 503 }
      );
    }

    // Constant-time HMAC-SHA256 verification over `${razorpay_order_id}|${razorpay_payment_id}`
    const isValidSignature = verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret: secretToUse,
    });

    if (!isValidSignature) {
      markPaymentFailed({
        razorpayOrderId,
        razorpayPaymentId,
        reason: "Cryptographic HMAC-SHA256 signature verification failed",
      });
      return NextResponse.json(
        {
          verified: false,
          error: "Cryptographic signature verification failed. Order was not marked paid.",
        },
        { status: 400 }
      );
    }

    const result = fulfillVerifiedOrderPayment({
      razorpayOrderId,
      razorpayPaymentId,
      expectedUserId: user.id,
      signatureVerified: true,
      method: isQaOrder ? "qa_hmac_verified" : "razorpay_checkout",
    });

    if (result.error || !result.order) {
      return NextResponse.json(
        { error: result.error || "Order fulfillment failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      alreadyFulfilled: result.alreadyFulfilled,
      order: result.order,
    });
  } catch {
    return NextResponse.json(
      { error: "Error verifying payment signature." },
      { status: 500 }
    );
  }
}
