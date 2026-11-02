import crypto from "crypto";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(";")[0];
}

async function runTests() {
  console.log("=== ENOX E2E & SECURITY VERIFICATION SUITE ===");

  // 1. Public Catalog & Draft Filtering
  const catRes = await fetch(`${BASE}/api/books`);
  assert(catRes.status === 200, "GET /api/books returns 200");
  const catData = await catRes.json();
  assert(catData.books.length === 6, "Public catalog returns 6 published books");
  assert(
    !catData.books.some((b) => b.status !== "published"),
    "No draft or archived books appear in public catalog"
  );

  // 2. Search & Category Filter
  const searchRes = await fetch(`${BASE}/api/books?q=Refractive`);
  const searchData = await searchRes.json();
  assert(searchData.books.length === 1, "Search by keyword 'Refractive' finds exact match");

  // 3. Draft Book Detail Page must return 404
  const draftDetailRes = await fetch(
    `${BASE}/api/books/zero-knowledge-proofs-in-practice-draft`
  );
  assert(draftDetailRes.status === 404, "Unpublished draft book returns 404 on public detail endpoint");

  // 4. Unauthenticated Download Attempt -> 401
  const unauthDl = await fetch(`${BASE}/api/downloads/book-glass-interfaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "PDF" }),
  });
  assert(unauthDl.status === 401, "Unauthenticated download request is denied with 401");

  // 5. Signup a fresh Customer Account
  const testEmail = `qa.reader.${Date.now()}@enox.store`;
  const signupRes = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "SecurePassword!2026",
      fullName: "QA Test Reader",
      newsletterConsent: true,
    }),
  });
  assert(signupRes.status === 201, "POST /api/auth/signup creates customer account (201)");
  const customerCookie = extractCookie(signupRes);
  assert(Boolean(customerCookie), "Session cookie issued on signup");

  // 6. Customer RBAC Check against /api/admin -> 403
  const customerAdminAttempt = await fetch(`${BASE}/api/admin`, {
    headers: { Cookie: customerCookie },
  });
  assert(
    customerAdminAttempt.status === 403,
    "Customer account is denied access to /api/admin with 403 Forbidden"
  );

  // 7. Customer Attempting to Download Unowned Ebook -> 403
  const unownedDl = await fetch(`${BASE}/api/downloads/book-glass-interfaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({ format: "PDF" }),
  });
  assert(
    unownedDl.status === 403,
    "Authenticated customer is denied download for unowned ebook with 403"
  );

  // 8. Non-Purchaser Review Attempt -> 403
  const unownedReview = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      bookId: "book-quant-microstructure",
      rating: 5,
      title: "Great book",
      comment: "Attempting to review without owning the book.",
    }),
  });
  assert(
    unownedReview.status === 403,
    "Non-purchaser is blocked from submitting a review with 403"
  );

  // 9. Server-Side Cart & Promo Validation
  const cartValRes = await fetch(`${BASE}/api/cart/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      bookIds: ["book-quant-microstructure"],
      promoCode: "ENOX20",
    }),
  });
  const cartVal = await cartValRes.json();
  assert(cartVal.subtotalInr === 1499, "Server cart subtotal is ₹1499");
  assert(cartVal.discountInr === 300, "Server ENOX20 20% discount is ₹300");
  assert(cartVal.totalInr === 1199, "Server payable total is ₹1199");

  // 10. Live Razorpay Missing Credentials Guard -> 503
  const liveCheckoutAttempt = await fetch(`${BASE}/api/checkout/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      bookIds: ["book-quant-microstructure"],
      promoCode: "ENOX20",
      useQaSignatureSandbox: false,
    }),
  });
  assert(
    liveCheckoutAttempt.status === 503,
    "Checkout without live Razorpay credentials returns 503 setup notice (never fakes live payment)"
  );

  // 11. QA Cryptographic Sandbox Order Creation & Signature Verification
  const qaOrderRes = await fetch(`${BASE}/api/checkout/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      bookIds: ["book-quant-microstructure"],
      promoCode: "ENOX20",
      useQaSignatureSandbox: true,
    }),
  });
  assert(qaOrderRes.status === 200, "Pending order created in QA signature sandbox");
  const qaOrderData = await qaOrderRes.json();
  assert(qaOrderData.order.status === "pending", "New order starts in 'pending' status");

  // 12. Tampered Signature Rejection -> 400
  const tamperedRes = await fetch(`${BASE}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      razorpay_order_id: qaOrderData.qaTestCredentials.razorpay_order_id,
      razorpay_payment_id: qaOrderData.qaTestCredentials.razorpay_payment_id,
      razorpay_signature: "0000000000000000000000000000000000000000000000000000000000000000",
    }),
  });
  assert(
    tamperedRes.status === 400,
    "Tampered payment signature is rejected with 400 and does not grant ownership"
  );

  // 13. Valid HMAC-SHA256 Signature Verification -> 200 & Library Grant
  const validVerifyRes = await fetch(`${BASE}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify(qaOrderData.qaTestCredentials),
  });
  assert(validVerifyRes.status === 200, "Valid HMAC-SHA256 payment signature verified (200)");
  const verifiedData = await validVerifyRes.json();
  assert(verifiedData.order.status === "paid", "Order status transitioned to 'paid'");

  // 14. Webhook Signature Verification & Idempotency
  const qaSecret = "enox_qa_sandbox_hmac_enox_default_server_hmac_secret_key_change_in_prod_2026";
  const whPayload = JSON.stringify({
    event: "payment.captured",
    event_id: `evt_idempotent_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: qaOrderData.qaTestCredentials.razorpay_payment_id,
          order_id: qaOrderData.qaTestCredentials.razorpay_order_id,
          method: "upi",
        },
      },
    },
  });
  const whSig = crypto.createHmac("sha256", qaSecret).update(whPayload).digest("hex");

  const whRes1 = await fetch(`${BASE}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": whSig,
      "x-enox-qa-webhook": "true",
    },
    body: whPayload,
  });
  const whData1 = await whRes1.json();
  assert(whRes1.status === 200 && whData1.idempotentDuplicate === false, "First webhook processed");

  const whRes2 = await fetch(`${BASE}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": whSig,
      "x-enox-qa-webhook": "true",
    },
    body: whPayload,
  });
  const whData2 = await whRes2.json();
  assert(
    whRes2.status === 200 && whData2.idempotentDuplicate === true,
    "Duplicate webhook event is handled idempotently"
  );

  // 15. Verified Owner Can Now Download Signed PDF Stream
  const ownerDlRes = await fetch(`${BASE}/api/downloads/book-quant-microstructure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({ format: "PDF" }),
  });
  assert(ownerDlRes.status === 200, "Verified owner receives short-lived signed download URL (200)");
  const ownerDlData = await ownerDlRes.json();

  const streamRes = await fetch(`${BASE}${ownerDlData.signedUrl}`, {
    headers: { Cookie: customerCookie },
  });
  assert(streamRes.status === 200, "Signed download stream returns 200");
  const pdfText = await streamRes.text();
  assert(pdfText.startsWith("%PDF-1.4"), "Downloaded stream is a valid %PDF-1.4 binary");

  // 16. Verified Owner Review Submission Succeeds
  const ownerRevRes = await fetch(`${BASE}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      bookId: "book-quant-microstructure",
      rating: 5,
      title: "Rigorous treatment of limit order books",
      comment: "Verified purchase review test — math and derivations are crystal clear.",
    }),
  });
  assert(ownerRevRes.status === 201, "Verified owner review submission succeeds (201)");

  // 17. Admin Login & Refund Revocation Test
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@enox.store",
      password: "EnoxAdmin!2026",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login succeeds (200)");
  const adminCookie = extractCookie(adminLoginRes);

  const adminSnapRes = await fetch(`${BASE}/api/admin`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminSnapRes.status === 200, "Admin can access /api/admin metrics & catalog (200)");

  // Refund the QA test order and verify download access is revoked
  const refundRes = await fetch(`${BASE}/api/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      action: "refund_order",
      orderId: qaOrderData.order.id,
      reason: "Automated QA refund revocation test",
    }),
  });
  assert(refundRes.status === 200, "Admin refund succeeds (200)");

  const postRefundDl = await fetch(`${BASE}/api/downloads/book-quant-microstructure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: customerCookie,
    },
    body: JSON.stringify({ format: "PDF" }),
  });
  assert(
    postRefundDl.status === 403,
    "After order refund, ebook download access is immediately revoked (403)"
  );

  console.log("=== ALL 17 E2E & SECURITY VERIFICATION TESTS PASSED ===");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
