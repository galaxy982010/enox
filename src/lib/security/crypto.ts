import crypto from "crypto";
import type { BookFormat, UserRole } from "@/types/enox";

function getServerSecret(): string {
  return (
    process.env.ENOX_SERVER_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "enox_default_server_hmac_secret_key_change_in_prod_2026"
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getServerSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", getServerSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface SignedDownloadTokenPayload {
  userId: string;
  bookId: string;
  orderId: string;
  format: BookFormat;
  exp: number;
  nonce: string;
}

export function createSignedDownloadToken(
  params: { userId: string; bookId: string; orderId: string; format: BookFormat },
  ttlSeconds = 300
): string {
  const payload: SignedDownloadTokenPayload = {
    ...params,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: crypto.randomBytes(8).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", `${getServerSecret()}:download`)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySignedDownloadToken(token: string): SignedDownloadTokenPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", `${getServerSecret()}:download`)
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedDownloadTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getRazorpayEffectiveSecret(): {
  isLiveConfigured: boolean;
  keyId: string | null;
  keySecret: string | null;
  webhookSecret: string | null;
  qaSandboxSecret: string;
  qaSandboxEnabled: boolean;
} {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || null;
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || null;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
  const isLiveConfigured = Boolean(keyId && keySecret);
  const qaSandboxEnabled = process.env.ALLOW_QA_SIGNATURE_SANDBOX !== "false" && process.env.NODE_ENV !== "production";
  const qaSandboxSecret = `enox_qa_sandbox_hmac_${getServerSecret()}`;

  return {
    isLiveConfigured,
    keyId,
    keySecret,
    webhookSecret,
    qaSandboxSecret,
    qaSandboxEnabled,
  };
}

export function computeRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  secret: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
}

export function verifyRazorpayPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, secret } = params;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) {
    return false;
  }
  const expected = computeRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, secret);
  const sigBuf = Buffer.from(razorpaySignature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function computeRazorpayWebhookSignature(rawBody: string, webhookSecret: string): string {
  return crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string;
  webhookSecret: string;
}): boolean {
  const { rawBody, signatureHeader, webhookSecret } = params;
  if (!rawBody || !signatureHeader || !webhookSecret) return false;
  const expected = computeRazorpayWebhookSignature(rawBody, webhookSecret);
  const sigBuf = Buffer.from(signatureHeader, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLength);
}
