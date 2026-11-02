"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flag,
  FolderKanban,
  Lock,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type {
  Book,
  BookFormat,
  Category,
  CopyrightReport,
  CreatorPayoutRecord,
  CreatorProfile,
  DownloadAuditLog,
  EarningsLedgerEntry,
  LegalPage,
  Order,
  Promotion,
  UserProfile,
} from "@/types/enox";

interface AdminSnapshot {
  metrics: {
    totalRevenueInr: number;
    totalPlatformCommissionInr: number;
    paidOrdersCount: number;
    totalOrdersCount: number;
    publishedBooksCount: number;
    pendingApprovalCount: number;
    draftBooksCount: number;
    archivedBooksCount: number;
    totalCustomers: number;
    totalCreators: number;
    totalDownloads: number;
    activePromotionsCount: number;
    openCopyrightReportsCount: number;
  };
  books: Book[];
  creators: (CreatorProfile & { published_products_count: number })[];
  categories: Category[];
  orders: Order[];
  customers: (UserProfile & {
    orders_count: number;
    owned_books_count: number;
    total_spent_inr: number;
  })[];
  promotions: Promotion[];
  downloadLogs: DownloadAuditLog[];
  legalPages: LegalPage[];
  copyrightReports: CopyrightReport[];
  earningsLedger: EarningsLedgerEntry[];
  payoutRecords: CreatorPayoutRecord[];
  integrationStatus: {
    supabaseConfigured: boolean;
    serviceRoleConfigured: boolean;
    razorpayLiveConfigured: boolean;
    razorpayWebhookConfigured: boolean;
    qaSandboxEnabled: boolean;
  };
}

export default function AdminDashboardPage() {
  const { user, authLoading, showToast } = useStore();
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    | "overview"
    | "books"
    | "creators"
    | "ledger"
    | "reports"
    | "categories"
    | "orders"
    | "customers"
    | "promotions"
    | "settings"
  >("overview");

  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [confirmDeleteBookId, setConfirmDeleteBookId] = useState<string | null>(null);
  const [confirmRefundOrderId, setConfirmRefundOrderId] = useState<string | null>(null);

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoType, setPromoType] = useState<"percentage" | "fixed_inr">("percentage");
  const [promoValue, setPromoValue] = useState(15);
  const [promoMinOrder, setPromoMinOrder] = useState(500);

  const [selectedLegalSlug, setSelectedLegalSlug] = useState("terms");
  const [legalTitle, setLegalTitle] = useState("");
  const [legalSubtitle, setLegalSubtitle] = useState("");
  const [legalMarkdown, setLegalMarkdown] = useState("");

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", { cache: "no-store" });
      if (res.ok) {
        const snap: AdminSnapshot = await res.json();
        setData(snap);
        const firstLegal =
          snap.legalPages.find((p) => p.slug === selectedLegalSlug) || snap.legalPages[0];
        if (firstLegal) {
          setLegalTitle(firstLegal.title);
          setLegalSubtitle(firstLegal.subtitle);
          setLegalMarkdown(firstLegal.content_markdown);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLegalSlug]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchSnapshot();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchSnapshot]);

  if (!authLoading && (!user || user.role !== "admin")) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-[22px] bg-white/90 border border-[#E8E1D6] p-10 space-y-4">
          <Lock className="w-8 h-8 text-[#C84444] mx-auto" />
          <h1 className="text-2xl font-bold text-[#33312E]">
            Administrator Authorization Required
          </h1>
          <p className="text-xs text-[#77736D]">
            Access to the ENOX Admin Console is restricted on the server to verified administrator
            accounts (`admin@enox.store`).
          </p>
          <Link
            href="/login?next=/admin"
            className="inline-block px-6 py-3 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white"
          >
            Sign In as Administrator
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert_book", book: editingBook }),
    });
    const out = await res.json();
    if (!res.ok) {
      showToast("Error", out.error || "Could not save product.", "error");
      return;
    }
    showToast("Catalog Updated", `"${out.book.title}" saved (${out.book.status}).`, "success");
    setEditingBook(null);
    fetchSnapshot();
  };

  const handleQuickBookToggle = async (book: Book, patch: Partial<Book>) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_book",
        book: { ...book, ...patch },
      }),
    });
    if (res.ok) {
      showToast("Updated", `Updated "${book.title}".`, "success");
      fetchSnapshot();
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_book", bookId }),
    });
    const out = await res.json();
    if (res.ok) {
      showToast(
        out.action === "archived" ? "Product Archived" : "Product Deleted",
        out.action === "archived"
          ? "Archived to preserve existing customer library access."
          : "Draft removed from catalog.",
        "info"
      );
      setConfirmDeleteBookId(null);
      fetchSnapshot();
    }
  };

  const handleUploadPrivateFile = async (
    bookId: string,
    format: BookFormat,
    file: File | undefined
  ) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("bookId", bookId);
    fd.append("format", format);
    fd.append("file", file);

    const res = await fetch("/api/admin", {
      method: "POST",
      body: fd,
    });
    const out = await res.json();
    if (!res.ok) {
      showToast("Upload Failed", out.error || "Invalid file.", "error");
      return;
    }
    showToast(
      "Private File Uploaded",
      `Stored ${format} in private_storage/ebooks/ (${out.book.file_size_label}).`,
      "success"
    );
    fetchSnapshot();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_category",
        category: { name: catName, description: catDesc },
      }),
    });
    if (res.ok) {
      setCatName("");
      setCatDesc("");
      showToast("Category Created", "Added new category to marketplace.", "success");
      fetchSnapshot();
    }
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert_promotion",
        promotion: {
          code: promoCode,
          title: promoTitle,
          discount_type: promoType,
          discount_value: promoValue,
          min_order_inr: promoMinOrder,
          is_active: true,
        },
      }),
    });
    if (res.ok) {
      setPromoCode("");
      setPromoTitle("");
      showToast("Promotion Created", `Code ${promoCode.toUpperCase()} is now active.`, "success");
      fetchSnapshot();
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "refund_order",
        orderId,
        reason: "Admin refund & library revocation",
      }),
    });
    const out = await res.json();
    if (res.ok) {
      showToast(
        "Order Refunded",
        `Order marked refunded and ${out.revokedCount} library license(s) revoked.`,
        "info"
      );
      setConfirmRefundOrderId(null);
      fetchSnapshot();
    }
  };

  const handleUpdateCopyrightReport = async (
    reportId: string,
    status: "open" | "investigating" | "resolved"
  ) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_copyright_report",
        reportId,
        status,
      }),
    });
    if (res.ok) {
      showToast("Report Updated", `Copyright report marked ${status}.`, "success");
      fetchSnapshot();
    }
  };

  const handleSaveLegalPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_legal_page",
        slug: selectedLegalSlug,
        title: legalTitle,
        subtitle: legalSubtitle,
        content_markdown: legalMarkdown,
      }),
    });
    if (res.ok) {
      showToast("Policy Saved", `Updated /legal/${selectedLegalSlug}.`, "success");
      fetchSnapshot();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="rounded-[22px] bg-white/90 backdrop-blur-xl p-6 sm:p-8 border border-[#E8E1D6] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#33312E] text-white text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#33312E]" />
            <span>ENOX Admin Console · Server RBAC Verified</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#33312E] mt-2">
            Marketplace Operations, Approvals &amp; Commission Ledger
          </h1>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "books", label: "Product Approvals & Catalog", icon: BookOpen },
              { id: "creators", label: "Creators", icon: Sparkles },
              { id: "ledger", label: "Earnings & Payouts", icon: Wallet },
              { id: "reports", label: "Copyright Reports", icon: Flag },
              { id: "categories", label: "Categories", icon: FolderKanban },
              { id: "orders", label: "Orders & Refunds", icon: RotateCcw },
              { id: "customers", label: "Customers", icon: Users },
              { id: "promotions", label: "Promotions", icon: Tag },
              { id: "settings", label: "Platform Settings", icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3 py-2 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  tab === item.id
                    ? "bg-[#33312E] text-white"
                    : "border border-[#E8E1D6] bg-[#F7F3EB] text-[#33312E] hover:bg-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading || !data ? (
        <div className="py-16 text-center text-sm text-[#77736D]">
          Loading marketplace operations data...
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#77736D]">
                    Gross Marketplace Volume
                  </span>
                  <p className="text-3xl font-bold text-[#33312E]">
                    ₹{data.metrics.totalRevenueInr.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-[#287A52] font-semibold">
                    ENOX Commission: ₹
                    {(data.metrics.totalPlatformCommissionInr || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#77736D]">
                    Product Approvals
                  </span>
                  <p className="text-3xl font-bold text-[#33312E]">
                    {data.metrics.publishedBooksCount} Live
                  </p>
                  <p className="text-xs text-[#292929] font-medium">
                    {data.metrics.pendingApprovalCount || 0} Pending Review ·{" "}
                    {data.metrics.draftBooksCount} Drafts
                  </p>
                </div>

                <div className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#77736D]">
                    Creators &amp; Customers
                  </span>
                  <p className="text-3xl font-bold text-[#33312E]">
                    {data.metrics.totalCreators || 4} Creators
                  </p>
                  <p className="text-xs text-[#77736D]">
                    {data.metrics.totalCustomers} registered customers
                  </p>
                </div>

                <div className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#77736D]">
                    Signed Downloads
                  </span>
                  <p className="text-3xl font-bold text-[#33312E]">
                    {data.metrics.totalDownloads}
                  </p>
                  <p className="text-xs text-[#77736D]">Verified file deliveries</p>
                </div>
              </div>

              {/* Recent Orders & Download Audit Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]">
                  <h2 className="text-base font-bold text-[#33312E]">Recent Orders</h2>
                  <div className="space-y-3">
                    {data.orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        className="flex items-center justify-between text-xs border-b border-[#E8E1D6] pb-2.5"
                      >
                        <div>
                          <p className="font-bold text-[#33312E]">{ord.order_number}</p>
                          <p className="text-[#77736D]">{ord.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#33312E]">
                            ₹{ord.total_inr.toLocaleString("en-IN")}
                          </p>
                          <span className="uppercase text-[10px] font-bold text-[#287A52]">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]">
                  <h2 className="text-base font-bold text-[#33312E]">
                    Download Security Audit Log
                  </h2>
                  {data.downloadLogs.length === 0 ? (
                    <p className="text-xs text-[#77736D]">No download audit events recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {data.downloadLogs.slice(0, 6).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between text-xs border-b border-[#E8E1D6] pb-2"
                        >
                          <div>
                            <p className="font-bold text-[#33312E]">
                              {log.book_title} ({log.format})
                            </p>
                            <p className="text-[11px] text-[#77736D]">
                              {log.user_email} · {log.reason}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${
                              log.status === "granted"
                                ? "bg-[#287A52]/12 text-[#287A52]"
                                : "bg-[#C84444]/12 text-[#C84444]"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT APPROVALS & CATALOG MANAGEMENT TAB */}
          {tab === "books" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#33312E]">
                  Product Approvals &amp; Catalog ({data.books.length})
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBook({
                      title: "",
                      subtitle: "",
                      author: "",
                      price_inr: 799,
                      original_price_inr: 999,
                      category_id: data.categories[0]?.id || "cat-ebooks",
                      short_description: "",
                      full_description: "",
                      cover_image: "/covers/refractive-systems.svg",
                      formats: ["PDF", "EPUB"],
                      status: "draft",
                      is_featured: false,
                      is_bestseller: false,
                      is_demo: false,
                    })
                  }
                  className="px-4 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Product</span>
                </button>
              </div>

              {editingBook && (
                <form
                  onSubmit={handleSaveBook}
                  className="rounded-[18px] bg-white p-6 space-y-4 border border-[#E8E1D6]"
                >
                  <h3 className="text-base font-bold text-[#33312E]">
                    {editingBook.id ? "Edit Product" : "Create New Product"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={editingBook.title || ""}
                        onChange={(e) =>
                          setEditingBook({ ...editingBook, title: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Creator *</label>
                      <input
                        type="text"
                        required
                        value={editingBook.author || ""}
                        onChange={(e) =>
                          setEditingBook({ ...editingBook, author: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Price (INR ₹) *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={editingBook.price_inr ?? 799}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            price_inr: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Category *</label>
                      <select
                        value={editingBook.category_id || ""}
                        onChange={(e) =>
                          setEditingBook({ ...editingBook, category_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      >
                        {data.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Cover Image Path</label>
                      <input
                        type="text"
                        value={editingBook.cover_image || "/covers/refractive-systems.svg"}
                        onChange={(e) =>
                          setEditingBook({ ...editingBook, cover_image: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Publication Status</label>
                      <select
                        value={editingBook.status || "draft"}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            status: e.target.value as Book["status"],
                          })
                        }
                        className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                      >
                        <option value="draft">Draft (Hidden from public)</option>
                        <option value="pending_review">Pending Review (Hidden from public)</option>
                        <option value="published">Published (Live in catalog)</option>
                        <option value="rejected">Rejected</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Short Description</label>
                    <input
                      type="text"
                      value={editingBook.short_description || ""}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          short_description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Full Description</label>
                    <textarea
                      rows={3}
                      value={editingBook.full_description || ""}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          full_description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(editingBook.is_featured)}
                        onChange={(e) =>
                          setEditingBook({ ...editingBook, is_featured: e.target.checked })
                        }
                      />
                      <span>Featured</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(editingBook.is_bestseller)}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            is_bestseller: e.target.checked,
                          })
                        }
                      />
                      <span>Bestseller</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
                    >
                      Save Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBook(null)}
                      className="px-5 py-2.5 rounded-[10px] text-xs font-semibold border border-[#E8E1D6] text-[#33312E] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {data.books.map((book) => (
                  <div
                    key={book.id}
                    className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${
                            book.status === "published"
                              ? "bg-[#287A52]/12 text-[#287A52]"
                              : book.status === "pending_review"
                                ? "bg-[#33312E]/20 text-[#292929]"
                                : "bg-[#F7F3EB] text-[#77736D]"
                          }`}
                        >
                          {book.status}
                        </span>
                        {book.is_featured && (
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#F7F3EB] border border-[#33312E]/40 text-[#33312E]">
                            Featured
                          </span>
                        )}
                        <span className="text-xs text-[#77736D]">{book.category_name}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#33312E]">{book.title}</h3>
                      <p className="text-xs text-[#77736D]">
                        {book.author} · ₹{book.price_inr.toLocaleString("en-IN")} · Sales:{" "}
                        {book.sales_count}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#E8E1D6] bg-[#F7F3EB] inline-flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload PDF</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadPrivateFile(book.id, "PDF", e.target.files?.[0])
                          }
                        />
                      </label>

                      {book.status === "pending_review" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickBookToggle(book, { status: "published" })}
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-[#287A52] text-white cursor-pointer"
                          >
                            Approve &amp; Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickBookToggle(book, { status: "rejected" })}
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#C84444]/30 text-[#C84444] cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickBookToggle(book, {
                            status: book.status === "published" ? "unlisted" : "published",
                          })
                        }
                        className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#E8E1D6] bg-white cursor-pointer"
                      >
                        {book.status === "published" ? "Unlist" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingBook(book)}
                        className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#E8E1D6] bg-white cursor-pointer"
                      >
                        Edit
                      </button>

                      {confirmDeleteBookId === book.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(book.id)}
                            className="px-3 py-1.5 rounded-[8px] text-xs font-bold bg-[#C84444] text-white cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBookId(null)}
                            className="px-2 py-1.5 text-xs text-[#77736D] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteBookId(book.id)}
                          aria-label={`Delete or archive ${book.title}`}
                          className="p-2 rounded-[8px] text-[#C84444] hover:bg-[#C84444]/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATOR MANAGEMENT TAB */}
          {tab === "creators" && (
            <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#33312E]">
                Creator Management ({data.creators?.length || 0})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E1D6] text-[#77736D]">
                      <th className="py-3 pr-4">Creator</th>
                      <th className="py-3 px-4">Plan Tier</th>
                      <th className="py-3 px-4">Commission Rate</th>
                      <th className="py-3 px-4">Published Products</th>
                      <th className="py-3 pl-4">Storefront</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D6]">
                    {(data.creators || []).map((cr) => (
                      <tr key={cr.id}>
                        <td className="py-3.5 pr-4">
                          <p className="font-bold text-[#33312E]">{cr.name}</p>
                          <span className="text-[#77736D]">{cr.tagline}</span>
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-[#33312E]">
                          {cr.plan_tier}
                        </td>
                        <td className="py-3.5 px-4 text-[#77736D]">
                          {cr.commission_rate_percent}% ENOX /{" "}
                          {100 - cr.commission_rate_percent}% Creator
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#33312E]">
                          {cr.published_products_count} / {cr.max_active_listings}
                        </td>
                        <td className="py-3.5 pl-4">
                          <Link
                            href={`/creators/${cr.slug}`}
                            className="font-semibold text-[#33312E] hover:underline"
                          >
                            /creators/{cr.slug}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EARNINGS LEDGER, COMMISSION REPORTING & PAYOUT RECORDS */}
          {tab === "ledger" && (
            <div className="space-y-6">
              <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4">
                <h2 className="text-lg font-bold text-[#33312E]">
                  Earnings Ledger &amp; Commission Reporting
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E1D6] text-[#77736D]">
                        <th className="py-3 pr-4">Order</th>
                        <th className="py-3 px-4">Product &amp; Creator</th>
                        <th className="py-3 px-4">Gross Sale</th>
                        <th className="py-3 px-4">ENOX Commission</th>
                        <th className="py-3 px-4">Creator Net</th>
                        <th className="py-3 pl-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D6]">
                      {(data.earningsLedger || []).map((led) => (
                        <tr key={led.id}>
                          <td className="py-3 pr-4 font-semibold text-[#33312E]">
                            {led.order_number}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#33312E]">{led.book_title}</p>
                            <span className="text-[#77736D]">{led.creator_name}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#33312E]">
                            ₹{led.gross_inr}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#292929]">
                            ₹{led.enox_commission_inr} ({led.commission_rate_percent}%)
                          </td>
                          <td className="py-3 px-4 font-bold text-[#287A52]">
                            ₹{led.creator_net_inr}
                          </td>
                          <td className="py-3 pl-4">
                            <span className="rounded-[6px] bg-[#F7F3EB] border border-[#E8E1D6] px-2 py-0.5 text-[10px] font-semibold uppercase">
                              {led.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4">
                <h2 className="text-base font-bold text-[#33312E]">Creator Payout Records</h2>
                <div className="divide-y divide-[#E8E1D6] text-xs">
                  {(data.payoutRecords || []).map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-[#33312E]">
                          {pr.creator_name} · {pr.period_label}
                        </p>
                        <p className="text-[#77736D]">{pr.payout_method}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#287A52]">
                          ₹{pr.amount_inr.toLocaleString("en-IN")}
                        </p>
                        <span className="text-[10px] uppercase font-semibold text-[#77736D]">
                          {pr.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COPYRIGHT REPORTS TAB */}
          {tab === "reports" && (
            <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#33312E]">
                Copyright &amp; Quality Reports ({data.copyrightReports?.length || 0})
              </h2>
              {!data.copyrightReports || data.copyrightReports.length === 0 ? (
                <p className="text-xs text-[#77736D]">
                  No copyright or quality reports submitted.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.copyrightReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-[14px] border border-[#E8E1D6] bg-[#F7F3EB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-[#33312E]">
                          {rep.book_title} — <span className="text-[#C84444]">{rep.reason}</span>
                        </p>
                        <p className="text-[#77736D]">{rep.details}</p>
                        <p className="text-[11px] text-[#77736D]">
                          Reported by {rep.reporter_name} ({rep.reporter_email})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-[6px] bg-white border border-[#E8E1D6] px-2.5 py-1 text-[10px] font-bold uppercase">
                          {rep.status}
                        </span>
                        {rep.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCopyrightReport(rep.id, "resolved")}
                            className="rounded-[8px] bg-[#33312E] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {tab === "categories" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleAddCategory}
                className="lg:col-span-4 rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]"
              >
                <h2 className="text-base font-bold text-[#33312E]">Add Category</h2>
                <div>
                  <label className="block text-xs font-bold mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g., Design Kits"
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
                >
                  Save Category
                </button>
              </form>

              <div className="lg:col-span-8 space-y-3">
                {data.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-[#33312E]">{cat.name}</h3>
                      <p className="text-xs text-[#77736D]">{cat.description}</p>
                    </div>
                    <span className="px-3 py-1 rounded-[8px] text-xs font-semibold bg-[#F7F3EB] border border-[#E8E1D6]">
                      {cat.book_count || 0} Published
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS & REFUNDS TAB */}
          {tab === "orders" && (
            <div className="space-y-4">
              {data.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#33312E]">
                      {ord.order_number} · ₹{ord.total_inr.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-[#77736D]">
                      {ord.customer_name} ({ord.customer_email}) ·{" "}
                      {new Date(ord.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-[8px] text-xs font-bold uppercase ${
                        ord.status === "paid"
                          ? "bg-[#287A52]/12 text-[#287A52]"
                          : ord.status === "refunded"
                            ? "bg-[#33312E]/15 text-[#292929]"
                            : "bg-[#F7F3EB] text-[#77736D]"
                      }`}
                    >
                      {ord.status}
                    </span>

                    {ord.status === "paid" && (
                      <>
                        {confirmRefundOrderId === ord.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRefundOrder(ord.id)}
                              className="px-3 py-1.5 rounded-[8px] text-xs font-bold bg-[#C84444] text-white cursor-pointer"
                            >
                              Confirm Refund &amp; Revoke
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRefundOrderId(null)}
                              className="text-xs text-[#77736D] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRefundOrderId(ord.id)}
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#E8E1D6] bg-white cursor-pointer"
                          >
                            Issue Refund
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {tab === "customers" && (
            <div className="space-y-3">
              {data.customers.map((c) => (
                <div
                  key={c.id}
                  className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-[#33312E]">
                      {c.full_name}{" "}
                      <span className="text-xs font-normal text-[#77736D]">({c.email})</span>
                    </p>
                    <p className="text-xs text-[#77736D]">
                      Role: {c.role} · Joined {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-[#33312E]">
                      ₹{c.total_spent_inr.toLocaleString("en-IN")} spent
                    </p>
                    <p className="text-[#77736D]">{c.owned_books_count} active library products</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROMOTIONS TAB */}
          {tab === "promotions" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleAddPromo}
                className="lg:col-span-4 rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]"
              >
                <h2 className="text-base font-bold text-[#33312E]">Create Promotion</h2>
                <div>
                  <label className="block text-xs font-bold mb-1">Promo Code</label>
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="SPRING25"
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="25% Seasonal Offer"
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">Type</label>
                    <select
                      value={promoType}
                      onChange={(e) =>
                        setPromoType(e.target.value as "percentage" | "fixed_inr")
                      }
                      className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_inr">Flat INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={promoValue}
                      onChange={(e) => setPromoValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Min Order (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={promoMinOrder}
                    onChange={(e) => setPromoMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
                >
                  Save Promotion
                </button>
              </form>

              <div className="lg:col-span-8 space-y-3">
                {data.promotions.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex items-center justify-between"
                  >
                    <div>
                      <span className="px-2.5 py-1 rounded-[6px] bg-[#33312E] text-white font-mono text-xs font-bold">
                        {p.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#33312E] mt-1.5">{p.title}</h3>
                      <p className="text-xs text-[#77736D]">
                        {p.discount_type === "percentage"
                          ? `${p.discount_value}% off`
                          : `₹${p.discount_value} off`}{" "}
                        · Min order ₹{p.min_order_inr} · Used {p.usage_count} times
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLATFORM SETTINGS & LEGAL PAGES TAB */}
          {tab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]">
                <h2 className="text-base font-bold text-[#33312E]">
                  Platform &amp; Integration Settings
                </h2>
                <ul className="space-y-2.5 text-xs">
                  <li className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F3EB]">
                    <span>Supabase Client</span>
                    <span className="font-bold">
                      {data.integrationStatus.supabaseConfigured
                        ? "Connected"
                        : "Local Persistent Store"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F3EB]">
                    <span>Razorpay Gateway Keys</span>
                    <span className="font-bold">
                      {data.integrationStatus.razorpayLiveConfigured
                        ? "Live / Test Keys Set"
                        : "Not Configured (.env.local)"}
                    </span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-[10px] bg-[#F7F3EB]">
                    <span>Private Digital Storage</span>
                    <span className="font-bold text-[#287A52] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active &amp; Isolated
                    </span>
                  </li>
                </ul>
              </div>

              <form
                onSubmit={handleSaveLegalPage}
                className="lg:col-span-7 rounded-[18px] bg-white/90 p-6 space-y-4 border border-[#E8E1D6]"
              >
                <h2 className="text-base font-bold text-[#33312E]">
                  Editable Legal &amp; Policy Pages
                </h2>
                <div>
                  <label className="block text-xs font-bold mb-1">Select Policy</label>
                  <select
                    value={selectedLegalSlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setSelectedLegalSlug(slug);
                      const found = data.legalPages.find((p) => p.slug === slug);
                      if (found) {
                        setLegalTitle(found.title);
                        setLegalSubtitle(found.subtitle);
                        setLegalMarkdown(found.content_markdown);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  >
                    {data.legalPages.map((lp) => (
                      <option key={lp.slug} value={lp.slug}>
                        {lp.title} (/legal/{lp.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Page Title</label>
                  <input
                    type="text"
                    value={legalTitle}
                    onChange={(e) => setLegalTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Policy Content (Markdown)</label>
                  <textarea
                    rows={8}
                    value={legalMarkdown}
                    onChange={(e) => setLegalMarkdown(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] bg-white border border-[#E8E1D6] text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
                >
                  Save Policy Changes
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
