import { NextResponse } from "next/server";
import {
  checkAndRecordWebhookEvent,
  fulfillVerifiedOrderPayment,
  markPaymentFailed,
  refundOrderAndRevokeOwnership,
} from "@/lib/db/store";
import {
  getRazorpayEffectiveSecret,
  verifyRazorpayWebhookSignature,
} from "@/lib/security/crypto";

export async function POST(request: Request) {
  // 1. Read exact raw request body for HMAC-SHA256 verification
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-razorpay-signature") || "";
  const headerEventId = request.headers.get("x-razorpay-event-id") || "";

  if (!rawBody || !signatureHeader) {
    return NextResponse.json(
      { error: "Missing webhook payload or x-razorpay-signature header." },
      { status: 400 }
    );
  }

  const cfg = getRazorpayEffectiveSecret();
  const isQaWebhook = request.headers.get("x-enox-qa-webhook") === "true";
  const secretToUse =
    isQaWebhook && cfg.qaSandboxEnabled
      ? cfg.qaSandboxSecret
      : cfg.webhookSecret;

  if (!secretToUse) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  // 2. Verify webhook signature against raw body using constant-time comparison
  const validSig = verifyRazorpayWebhookSignature({
    rawBody,
    signatureHeader,
    webhookSecret: secretToUse,
  });

  if (!validSig) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType = String(payload.event || "");
    const paymentEntity = payload?.payload?.payment?.entity || {};
    const orderEntity = payload?.payload?.order?.entity || {};
    const refundEntity = payload?.payload?.refund?.entity || {};

    const razorpayOrderId =
      paymentEntity.order_id ||
      orderEntity.id ||
      refundEntity.order_id ||
      payload.razorpay_order_id ||
      "";
    const razorpayPaymentId =
      paymentEntity.id ||
      refundEntity.payment_id ||
      payload.razorpay_payment_id ||
      "";

    const eventId =
      headerEventId ||
      payload.event_id ||
      `${eventType}:${razorpayOrderId}:${razorpayPaymentId}`;

    // 3. Enforce webhook idempotency
    const idempotency = checkAndRecordWebhookEvent({
      eventId,
      eventType,
      razorpayOrderId,
      razorpayPaymentId,
    });

    if (idempotency.isDuplicate) {
      return NextResponse.json({
        ok: true,
        idempotentDuplicate: true,
        eventId,
        message: "Webhook event already processed.",
      });
    }

    // 4. Handle webhook events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const fulfilled = fulfillVerifiedOrderPayment({
        razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || `pay_wh_${Date.now()}`,
        webhookConfirmed: true,
        method: paymentEntity.method || "webhook",
      });
      if (fulfilled.error) {
        return NextResponse.json({ error: fulfilled.error }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        idempotentDuplicate: false,
        event: eventType,
        orderId: fulfilled.order?.id,
        status: fulfilled.order?.status,
      });
    }

    if (eventType === "payment.failed") {
      const failed = markPaymentFailed({
        razorpayOrderId,
        razorpayPaymentId,
        reason: paymentEntity.error_description || "Webhook reported payment.failed",
      });
      return NextResponse.json({
        ok: true,
        idempotentDuplicate: false,
        event: eventType,
        orderId: failed?.id,
        status: failed?.status,
      });
    }

    if (eventType === "refund.processed" || eventType === "payment.refunded") {
      const refunded = refundOrderAndRevokeOwnership({
        razorpayOrderId,
        reason: "Razorpay refund.processed webhook received",
      });
      return NextResponse.json({
        ok: true,
        idempotentDuplicate: false,
        event: eventType,
        orderId: refunded.order?.id,
        revokedLibraryCount: refunded.revokedCount,
      });
    }

    return NextResponse.json({
      ok: true,
      idempotentDuplicate: false,
      event: eventType,
      ignored: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON webhook body." },
      { status: 400 }
    );
  }
}
