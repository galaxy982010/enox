"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Download,
  FileText,
  Heart,
  LifeBuoy,
  Library,
  Lock,
  Package,
  Settings,
  User,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type {
  BookFormat,
  LibraryEntry,
  Order,
  SupportRequest,
  WishlistItem,
} from "@/types/enox";

type AccountTab = "library" | "orders" | "wishlist" | "settings" | "support";

function AccountInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AccountTab) || "library";
  const { user, authLoading, refreshSession, toggleWishlist, showToast } = useStore();

  const [tab, setTab] = useState<AccountTab>(initialTab);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Support Request Form
  const [supSubject, setSupSubject] = useState("");
  const [supCategory, setSupCategory] = useState("Order & Download Support");
  const [supMessage, setSupMessage] = useState("");
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => {
    const paramTab = searchParams.get("tab") as AccountTab;
    if (
      paramTab &&
      ["library", "orders", "wishlist", "settings", "support"].includes(paramTab)
    ) {
      setTab(paramTab);
    }
  }, [searchParams]);

  const loadAccountData = () => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setLibrary(d.library || []);
        setOrders(d.orders || []);
        setWishlist(d.wishlist || []);
        setSupportRequests(d.supportRequests || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setFullName(user.full_name);
    setBio(user.bio);
    setNewsletterConsent(user.newsletter_consent);
    loadAccountData();
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-[22px] bg-white/90 border border-[#E8E1D6] p-10 space-y-4">
          <Lock className="w-8 h-8 text-[#33312E] mx-auto" />
          <h1 className="text-2xl font-bold text-[#33312E]">Customer Account</h1>
          <p className="text-xs text-[#77736D]">
            Please sign in to access your purchases, download library, wishlist, and support
            requests.
          </p>
          <Link
            href="/login?next=/account"
            className="inline-block px-6 py-3 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleDownload = async (bookId: string, format: BookFormat) => {
    const key = `${bookId}:${format}`;
    setDownloadingKey(key);
    try {
      const res = await fetch(`/api/downloads/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        showToast("Download Denied", data.error || "Unauthorized download.", "error");
        return;
      }
      showToast("Signed URL Ready", `Downloading ${format} file...`, "success");
      window.location.href = data.signedUrl;
    } catch {
      showToast("Error", "Could not generate signed download link.", "error");
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        bio,
        newsletter_consent: newsletterConsent,
      }),
    });
    if (res.ok) {
      await refreshSession();
      showToast("Profile Saved", "Your account settings have been updated.", "success");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast("Password Error", data.error || "Could not update password.", "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    showToast("Password Updated", "Your password has been changed.", "success");
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSupport(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "support",
          subject: supSubject,
          category: supCategory,
          message: supMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("Support Error", data.error || "Could not submit ticket.", "error");
        return;
      }
      setSupSubject("");
      setSupMessage("");
      loadAccountData();
      showToast("Support Request Created", "Our support team has received your ticket.", "success");
    } finally {
      setSubmittingSupport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="rounded-[22px] bg-white/90 backdrop-blur-xl p-6 sm:p-8 border border-[#E8E1D6] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#F7F3EB] border border-[#E8E1D6] text-xs font-semibold text-[#33312E]">
            <User className="w-3.5 h-3.5" />
            <span>{user?.role === "admin" ? "Administrator Account" : "Customer Account"}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#33312E] mt-2">
            {user?.full_name}
          </h1>
          <p className="text-xs text-[#77736D]">{user?.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                id: "library",
                label: `My Purchases & Downloads (${library.length})`,
                icon: Library,
              },
              { id: "orders", label: `Order History (${orders.length})`, icon: Package },
              { id: "wishlist", label: `Wishlist (${wishlist.length})`, icon: Heart },
              { id: "settings", label: "Profile Settings", icon: Settings },
              { id: "support", label: "Support Requests", icon: LifeBuoy },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3.5 py-2.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
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

      {loading ? (
        <div className="py-12 text-center text-sm text-[#77736D]">Loading account data...</div>
      ) : tab === "library" ? (
        <div className="space-y-4">
          {library.length === 0 ? (
            <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-12 text-center space-y-4">
              <p className="text-base font-bold text-[#33312E]">
                You haven&apos;t purchased any digital products yet.
              </p>
              <Link
                href="/books"
                className="inline-block px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white"
              >
                Explore Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {library.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 flex flex-col sm:flex-row gap-5 items-start"
                >
                  {entry.book && (
                    <img
                      src={entry.book.cover_image}
                      alt={entry.book.title}
                      className="w-24 h-32 object-contain rounded-[10px] bg-[#EFE9DC]/65 p-2 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${
                          entry.status === "active"
                            ? "bg-[#287A52]/12 text-[#287A52]"
                            : "bg-[#C84444]/12 text-[#C84444]"
                        }`}
                      >
                        {entry.status === "active" ? "Active License" : "Revoked (Refunded)"}
                      </span>
                      <span className="text-[11px] text-[#77736D]">
                        Order {entry.order_number}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#33312E]">
                      {entry.book?.title || "Digital Product"}
                    </h3>
                    <p className="text-xs text-[#77736D]">{entry.book?.author}</p>
                    <p className="text-[11px] text-[#77736D]">
                      Downloads: {entry.download_count}
                    </p>

                    {entry.status === "active" && entry.book ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {entry.book.formats.map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            disabled={downloadingKey === `${entry.book_id}:${fmt}`}
                            onClick={() => handleDownload(entry.book_id, fmt)}
                            className="px-4 py-2 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {downloadingKey === `${entry.book_id}:${fmt}`
                                ? "Signing..."
                                : `Download ${fmt}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-[#C84444] pt-1">
                        Download disabled because this order was refunded.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "orders" ? (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-12 text-center">
              <p className="text-sm font-bold text-[#33312E]">No orders placed yet.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D6] pb-3">
                  <div>
                    <span className="text-xs font-bold text-[#33312E] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Order {ord.order_number}
                    </span>
                    <span className="text-[11px] text-[#77736D]">
                      Placed on {new Date(ord.created_at).toLocaleString("en-IN")}
                    </span>
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
                      {ord.status} / {ord.payment_status}
                    </span>
                    <span className="text-base font-bold text-[#33312E]">
                      ₹{ord.total_inr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs text-[#77736D]"
                    >
                      <span className="font-semibold text-[#33312E]">
                        {item.title_snapshot} ({item.author_snapshot})
                      </span>
                      <span>₹{item.unit_price_inr.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === "wishlist" ? (
        <div className="space-y-4">
          {wishlist.length === 0 ? (
            <div className="rounded-[18px] border border-[#E8E1D6] bg-white/90 p-12 text-center space-y-3">
              <p className="text-sm font-bold text-[#33312E]">Your wishlist is empty.</p>
              <Link
                href="/books"
                className="inline-block px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white"
              >
                Discover Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishlist.map(
                (w) =>
                  w.book && (
                    <div
                      key={w.id}
                      className="rounded-[16px] border border-[#E8E1D6] bg-white/90 p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <Link
                          href={`/books/${w.book.slug}`}
                          className="text-base font-bold text-[#33312E] hover:underline"
                        >
                          {w.book.title}
                        </Link>
                        <p className="text-xs text-[#77736D]">
                          By {w.book.author} · ₹{w.book.price_inr}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (w.book) {
                            toggleWishlist(w.book).then(() => loadAccountData());
                          }
                        }}
                        className="rounded-[8px] border border-[#E8E1D6] px-3 py-1.5 text-xs font-semibold text-[#C84444]"
                      >
                        Remove
                      </button>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      ) : tab === "support" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSupportSubmit}
            className="lg:col-span-5 rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-[#33312E]">New Support Request</h2>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">Category</label>
              <select
                value={supCategory}
                onChange={(e) => setSupCategory(e.target.value)}
                className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#33312E]"
              >
                <option value="Order & Download Support">Order &amp; Download Support</option>
                <option value="Billing & Refund Inquiry">Billing &amp; Refund Inquiry</option>
                <option value="Creator Account Assistance">Creator Account Assistance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">Subject</label>
              <input
                type="text"
                required
                value={supSubject}
                onChange={(e) => setSupSubject(e.target.value)}
                placeholder="Order # or product name"
                className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#33312E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={supMessage}
                onChange={(e) => setSupMessage(e.target.value)}
                placeholder="Describe how we can help..."
                className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#33312E]"
              />
            </div>
            <button
              type="submit"
              disabled={submittingSupport}
              className="rounded-[10px] bg-[#33312E] px-5 py-2.5 text-xs font-semibold text-white"
            >
              {submittingSupport ? "Submitting..." : "Submit Support Request"}
            </button>
          </form>

          <div className="lg:col-span-7 rounded-[18px] border border-[#E8E1D6] bg-white/90 p-6 space-y-4">
            <h2 className="text-base font-bold text-[#33312E]">
              Your Support Tickets ({supportRequests.length})
            </h2>
            {supportRequests.length === 0 ? (
              <p className="text-xs text-[#77736D]">No open support tickets.</p>
            ) : (
              <div className="divide-y divide-[#E8E1D6] text-xs">
                {supportRequests.map((req) => (
                  <div key={req.id} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#33312E]">{req.subject}</span>
                      <span className="rounded-[6px] bg-[#F7F3EB] border border-[#E8E1D6] px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[#77736D]">{req.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form
            onSubmit={handleUpdateProfile}
            className="rounded-[18px] p-6 space-y-4 border border-[#E8E1D6] bg-white/90"
          >
            <h2 className="text-base font-bold text-[#33312E]">Profile Settings</h2>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#77736D]">
              <input
                type="checkbox"
                checked={newsletterConsent}
                onChange={(e) => setNewsletterConsent(e.target.checked)}
              />
              <span>Subscribed to ENOX product updates</span>
            </label>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
            >
              Save Profile
            </button>
          </form>

          <form
            onSubmit={handleUpdatePassword}
            className="rounded-[18px] p-6 space-y-4 border border-[#E8E1D6] bg-white/90"
          >
            <h2 className="text-base font-bold text-[#33312E]">Change Password</h2>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33312E] mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] bg-white border border-[#E8E1D6] text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-[#33312E] text-white cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm">Loading account...</div>}>
      <AccountInner />
    </Suspense>
  );
}
