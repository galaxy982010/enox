import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth/session";
import {
  deleteOrArchiveBookAdmin,
  getAdminDashboardSnapshot,
  refundOrderAndRevokeOwnership,
  savePrivateUploadedEbookFile,
  updateCopyrightReportStatusAdmin,
  updateLegalPageAdmin,
  upsertBookAdmin,
  upsertCategoryAdmin,
  upsertPromotionAdmin,
} from "@/lib/db/store";
import { getRazorpayEffectiveSecret } from "@/lib/security/crypto";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { BookFormat } from "@/types/enox";

async function requireAdminSession() {
  const user = await getServerSessionUser();
  if (!user) {
    return { error: "Authentication required.", status: 401, user: null };
  }
  if (user.role !== "admin") {
    return {
      error: "Forbidden: Administrator authorization required.",
      status: 403,
      user: null,
    };
  }
  return { error: null, status: 200, user };
}

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snapshot = getAdminDashboardSnapshot();
  const rzp = getRazorpayEffectiveSecret();

  return NextResponse.json({
    ...snapshot,
    integrationStatus: {
      supabaseConfigured: isSupabaseServerConfigured(),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      razorpayLiveConfigured: rzp.isLiveConfigured,
      razorpayWebhookConfigured: Boolean(rzp.webhookSecret),
      qaSandboxEnabled: rzp.qaSandboxEnabled,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // Multipart upload for private PDF/EPUB files
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const bookId = String(formData.get("bookId") || "");
      const format = (String(formData.get("format") || "PDF").toUpperCase() === "EPUB"
        ? "EPUB"
        : "PDF") as BookFormat;
      const file = formData.get("file");

      if (!bookId || !(file instanceof File)) {
        return NextResponse.json(
          { error: "bookId and a valid file upload are required." },
          { status: 400 }
        );
      }

      const fileNameLower = file.name.toLowerCase();
      if (format === "PDF" && !fileNameLower.endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Uploaded PDF file must have a .pdf extension." },
          { status: 400 }
        );
      }
      if (format === "EPUB" && !fileNameLower.endsWith(".epub")) {
        return NextResponse.json(
          { error: "Uploaded EPUB file must have an .epub extension." },
          { status: 400 }
        );
      }
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds 50 MB limit." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mb = Math.max(0.1, Number((file.size / (1024 * 1024)).toFixed(1)));
      const saved = savePrivateUploadedEbookFile({
        bookId,
        format,
        buffer,
        fileSizeLabel: `${mb} MB`,
      });

      if (saved.error) {
        return NextResponse.json({ error: saved.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, book: saved.book });
    }

    const body = await request.json();
    const action = String(body.action || "");

    if (action === "upsert_book") {
      const res = upsertBookAdmin(body.book || {});
      if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true, book: res.book });
    }

    if (action === "delete_book") {
      const res = deleteOrArchiveBookAdmin(String(body.bookId || ""));
      if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
      return NextResponse.json({ ok: true, action: res.action, book: res.book });
    }

    if (action === "upsert_category") {
      const res = upsertCategoryAdmin(body.category || {});
      if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true, category: res.category });
    }

    if (action === "upsert_promotion") {
      const res = upsertPromotionAdmin(body.promotion || {});
      if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true, promotion: res.promotion });
    }

    if (action === "refund_order") {
      const res = refundOrderAndRevokeOwnership({
        orderId: String(body.orderId || ""),
        reason: String(body.reason || "Admin refund & ownership revocation"),
      });
      if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
      return NextResponse.json({
        ok: true,
        order: res.order,
        revokedCount: res.revokedCount,
      });
    }

    if (action === "update_legal_page") {
      const page = updateLegalPageAdmin({
        slug: String(body.slug || ""),
        title: String(body.title || ""),
        subtitle: String(body.subtitle || ""),
        content_markdown: String(body.content_markdown || ""),
      });
      if (!page) return NextResponse.json({ error: "Legal page not found." }, { status: 404 });
      return NextResponse.json({ ok: true, page });
    }

    if (action === "update_copyright_report") {
      const rep = updateCopyrightReportStatusAdmin(
        String(body.reportId || ""),
        body.status || "resolved"
      );
      if (!rep) return NextResponse.json({ error: "Copyright report not found." }, { status: 404 });
      return NextResponse.json({ ok: true, report: rep });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to execute admin operation." },
      { status: 500 }
    );
  }
}
