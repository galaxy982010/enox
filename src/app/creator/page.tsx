"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Wallet,
  BarChart3,
  CreditCard,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Upload,
  Check,
  ShieldCheck,
} from "lucide-react";
import type {
  Book,
  BookFormat,
  Category,
  CreatorPayoutRecord,
  CreatorProfile,
  EarningsLedgerEntry,
  Order,
} from "@/types/enox";
import { useStore } from "@/context/StoreContext";

type CreatorTab =
  | "overview"
  | "products"
  | "add-product"
  | "sales"
  | "earnings"
  | "analytics"
  | "subscription"
  | "settings";

function CreatorWorkspaceInner() {
  const searchParams = useSearchParams();
  const { user, refreshSession, showToast } = useStore();

  const rawTab = searchParams.get("tab");
  const initialTab: CreatorTab =
    rawTab === "orders"
      ? "sales"
      : rawTab === "storefront"
        ? "settings"
        : (rawTab as CreatorTab) || "overview";
  const [activeTab, setActiveTab] = useState<CreatorTab>(initialTab);

  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [products, setProducts] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<EarningsLedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<CreatorPayoutRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    activePublishedCount: 0,
    pendingReviewCount: 0,
    unlistedCount: 0,
    totalProductsCount: 0,
    maxActiveListings: 5,
    commissionRatePercent: 30,
    grossSalesInr: 0,
    enoxCommissionInr: 0,
    netEarningsInr: 0,
    totalSalesUnits: 0,
  });

  // 3-Step Add Product Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [prodTitle, setProdTitle] = useState("");
  const [prodSubtitle, setProdSubtitle] = useState("");
  const [prodShortDesc, setProdShortDesc] = useState("");
  const [prodFullDesc, setProdFullDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("cat-ebooks");
  const [prodPrice, setProdPrice] = useState(599);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<string>("799");
  const [prodTags, setProdTags] = useState("ebook, guide, framework");
  const [prodLanguage, setProdLanguage] = useState("English");
  const [prodFormats, setProdFormats] = useState<BookFormat[]>(["PDF", "EPUB"]);
  const [prodPages, setProdPages] = useState(140);
  const [coverFileName, setCoverFileName] = useState("product-cover-artwork.png");
  const [digitalFileName, setDigitalFileName] = useState("enox-master-edition.pdf");
  const [previewFileName, setPreviewFileName] = useState("sample-chapter-1.pdf");
  const [uploadProgress, setUploadProgress] = useState(100);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Storefront & Creator Settings State
  const [sfName, setSfName] = useState("");
  const [sfTagline, setSfTagline] = useState("");
  const [sfBio, setSfBio] = useState("");
  const [sfLocation, setSfLocation] = useState("");
  const [sfWebsite, setSfWebsite] = useState("");
  const [savingStorefront, setSavingStorefront] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const loadCreatorWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creator", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCreator(data.creator || null);
        setProducts(data.products || []);
        setOrders(data.orders || []);
        setLedger(data.earningsLedger || []);
        setPayouts(data.payoutRecords || []);
        setCategories(data.categories || []);
        if (data.stats) setStats(data.stats);
        if (data.creator) {
          setSfName(data.creator.name || "");
          setSfTagline(data.creator.tagline || data.creator.specialty || "");
          setSfBio(data.creator.bio || data.creator.short_bio || "");
          setSfLocation(data.creator.location || "");
          setSfWebsite(data.creator.website || "");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreatorWorkspace();
  }, [loadCreatorWorkspace]);

  const simulateAssetUpload = (setter: (name: string) => void, fileName: string) => {
    setter(fileName);
    setUploadProgress(25);
    setTimeout(() => setUploadProgress(65), 180);
    setTimeout(() => setUploadProgress(100), 400);
  };

  const handleProductSubmit = async (targetStatus: "draft" | "pending_review") => {
    if (!user) {
      showToast("Sign In Required", "Please sign in to submit products to ENOX.", "error");
      return;
    }
    if (targetStatus === "pending_review" && !rightsConfirmed) {
      showToast(
        "Rights Confirmation Required",
        "Please confirm that you hold the publishing rights for this digital product.",
        "error"
      );
      return;
    }

    setSubmittingProduct(true);
    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_product",
          status: targetStatus,
          title: prodTitle,
          subtitle: prodSubtitle,
          short_description: prodShortDesc,
          full_description: prodFullDesc,
          category_id: prodCategory,
          price_inr: Number(prodPrice),
          original_price_inr: prodOriginalPrice ? Number(prodOriginalPrice) : null,
          language: prodLanguage,
          formats: prodFormats,
          pages: Number(prodPages),
          highlights: prodTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => `Includes verified ${t} resource`),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("Submission Error", data.error || "Could not save product.", "error");
        return;
      }

      showToast(
        targetStatus === "draft" ? "Saved as Draft" : "Submitted for Approval",
        targetStatus === "draft"
          ? `"${data.book.title}" saved in your drafts.`
          : `"${data.book.title}" is now Pending Review by the ENOX curation team.`,
        "success"
      );
      setProdTitle("");
      setProdSubtitle("");
      setProdShortDesc("");
      setProdFullDesc("");
      setRightsConfirmed(false);
      setWizardStep(1);
      await loadCreatorWorkspace();
      setActiveTab("products");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handlePlanChange = async (nextPlan: "free" | "premium") => {
    if (!user) {
      showToast("Sign In Required", "Please sign in to manage your creator plan.", "error");
      return;
    }
    setUpdatingPlan(true);
    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_plan",
          plan: nextPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("Plan Update Failed", data.error || "Could not update plan.", "error");
        return;
      }
      await refreshSession();
      await loadCreatorWorkspace();
      showToast(
        nextPlan === "premium" ? "Upgraded to ENOX Premium" : "Switched to Free Creator Plan",
        nextPlan === "premium"
          ? "You now have up to 25 active listings and a 20% platform commission rate."
          : "Your plan is now Free (up to 5 active listings, 30% commission). Any listings above 5 are safely unlisted, never deleted.",
        "success"
      );
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Sign In Required", "Please sign in to update creator settings.", "error");
      return;
    }
    setSavingStorefront(true);
    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_storefront",
          name: sfName,
          tagline: sfTagline,
          bio: sfBio,
          location: sfLocation,
          website: sfWebsite,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("Update Error", data.error || "Could not save settings.", "error");
        return;
      }
      await loadCreatorWorkspace();
      showToast("Settings Saved", "Your creator profile and settings have been updated.", "success");
    } finally {
      setSavingStorefront(false);
    }
  };

  // Exact 8 Creator Dashboard sections from Prompt Section 6
  const navItems: {
    id: CreatorTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "products", label: "My Products", icon: Package },
    { id: "add-product", label: "Add Product", icon: PlusCircle },
    { id: "sales", label: "Sales", icon: ShoppingBag },
    { id: "earnings", label: "Earnings", icon: Wallet },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getStatusBadge = (status: Book["status"]) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#287A52]/10 border border-[#287A52]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#287A52]">
            <CheckCircle2 className="h-3 w-3" /> Published
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#EDE9DA] border border-[#E8E1D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#292929]">
            <Clock className="h-3 w-3" /> Pending Approval
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#F7F3EB] border border-[#E8E1D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#77736D]">
            Draft
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#C84444]/10 border border-[#C84444]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#C84444]">
            <AlertCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "unlisted":
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#EDE9DA] border border-[#E8E1D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#524F49]">
            Unlisted
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#524F49]">
              Creator Dashboard
            </span>
            {creator?.plan_tier === "premium" ? (
              <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#292929] px-2.5 py-0.5 text-[11px] font-semibold text-[#EDE9DA]">
                <Sparkles className="h-3 w-3" /> ENOX Premium
              </span>
            ) : (
              <span className="rounded-[6px] bg-white border border-[#E8E1D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#524F49]">
                Free Creator
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#292929] tracking-tight">
            {creator?.name || "ENOX Creator Workspace"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {creator && (
            <Link
              href={`/creators/${creator.slug}`}
              className="btn-secondary-glass inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
            >
              <span>Public Profile</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#77736D]" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("add-product")}
            className="btn-primary-glass inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {!user && (
        <div className="liquid-glass-cream mt-6 rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#292929]">
            <strong>Previewing Creator Dashboard:</strong> Sign in with your ENOX account to upload
            products, manage listings, and update your subscription.
          </div>
          <Link
            href="/login?next=/creator"
            className="btn-primary-glass inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold shrink-0"
          >
            Sign In to Publish
          </Link>
        </div>
      )}

      {/* Mobile Horizontal Navigation */}
      <div className="mt-6 flex lg:hidden overflow-x-auto gap-1.5 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "bg-[#292929] text-white"
                  : "border border-[#E8E1D6] bg-white/85 text-[#292929]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Desktop Sidebar + Active Workspace Content */}
      <div className="mt-6 lg:mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="liquid-glass-strong sticky top-28 rounded-[16px] p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-[#292929] text-white"
                      : "text-[#292929] hover:bg-[#F7F3EB]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-[#EDE9DA]" : "text-[#524F49]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Workspace Main Panel */}
        <div className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="liquid-glass-strong rounded-[16px] p-12 text-center text-sm text-[#524F49]">
              Loading Creator Dashboard...
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="liquid-glass-card p-5">
                      <span className="text-xs font-medium text-[#524F49]">
                        Net Creator Earnings
                      </span>
                      <p className="mt-2 text-2xl font-bold text-[#287A52]">
                        ₹{stats.netEarningsInr.toLocaleString("en-IN")}
                      </p>
                      <span className="mt-1 block text-[11px] text-[#77736D]">
                        After {stats.commissionRatePercent}% platform commission
                      </span>
                    </div>

                    <div className="liquid-glass-card p-5">
                      <span className="text-xs font-medium text-[#524F49]">
                        Gross Product Sales
                      </span>
                      <p className="mt-2 text-2xl font-bold text-[#292929]">
                        ₹{stats.grossSalesInr.toLocaleString("en-IN")}
                      </p>
                      <span className="mt-1 block text-[11px] text-[#77736D]">
                        {stats.totalSalesUnits} total copies sold
                      </span>
                    </div>

                    <div className="liquid-glass-card p-5">
                      <span className="text-xs font-medium text-[#524F49]">Active Listings</span>
                      <p className="mt-2 text-2xl font-bold text-[#292929]">
                        {stats.activePublishedCount} / {stats.maxActiveListings}
                      </p>
                      <span className="mt-1 block text-[11px] text-[#77736D]">
                        {stats.pendingReviewCount} pending approval
                      </span>
                    </div>

                    <div className="liquid-glass-card p-5">
                      <span className="text-xs font-medium text-[#524F49]">Current Plan</span>
                      <p className="mt-2 text-xl font-bold text-[#292929]">
                        {creator?.plan_tier === "premium" ? "ENOX Premium" : "Free Creator"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("subscription")}
                        className="mt-1 text-[11px] font-semibold text-[#7C8665] hover:underline cursor-pointer"
                      >
                        Manage subscription →
                      </button>
                    </div>
                  </div>

                  {/* Quick Recent Products */}
                  <div className="liquid-glass-strong rounded-[16px] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-[#292929]">My Products</h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab("products")}
                        className="text-xs font-semibold text-[#7C8665] hover:underline cursor-pointer"
                      >
                        View all ({products.length})
                      </button>
                    </div>
                    <div className="divide-y divide-[#E8E1D6]">
                      {products.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#292929]">{p.title}</p>
                            <p className="text-xs text-[#524F49]">
                              {p.category_name} · ₹{p.price_inr} · {p.sales_count} sales
                            </p>
                          </div>
                          {getStatusBadge(p.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MY PRODUCTS */}
              {activeTab === "products" && (
                <div className="liquid-glass-strong rounded-[16px] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D6] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#292929]">My Products</h2>
                      <p className="text-xs text-[#524F49]">
                        Track approval status (`Published`, `Pending Approval`, `Draft`, `Unlisted`,
                        `Rejected`).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("add-product")}
                      className="btn-primary-glass px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E8E1D6] text-[#524F49]">
                          <th className="py-3 pr-4 font-semibold">Product</th>
                          <th className="py-3 px-4 font-semibold">Category</th>
                          <th className="py-3 px-4 font-semibold">Price</th>
                          <th className="py-3 px-4 font-semibold">Sales</th>
                          <th className="py-3 pl-4 font-semibold">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E1D6]">
                        {products.map((prod) => (
                          <tr key={prod.id}>
                            <td className="py-3.5 pr-4">
                              <p className="font-semibold text-[#292929]">{prod.title}</p>
                              <span className="text-[11px] text-[#77736D]">
                                {prod.formats.join(", ")} · {prod.pages} pages
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#524F49]">{prod.category_name}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#292929]">
                              ₹{prod.price_inr.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 text-[#524F49]">{prod.sales_count}</td>
                            <td className="py-3.5 pl-4">{getStatusBadge(prod.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. ADD PRODUCT */}
              {activeTab === "add-product" && (
                <div className="liquid-glass-strong rounded-[16px] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#E8E1D6] pb-4">
                    <h2 className="text-lg font-bold text-[#292929]">Add Digital Product</h2>
                    <p className="text-xs text-[#524F49] mt-1">
                      Complete the 3-step upload form. New submissions are reviewed before going
                      live in the marketplace.
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {[
                        { step: 1, title: "Step 1: Product details" },
                        { step: 2, title: "Step 2: Product files & upload" },
                        { step: 3, title: "Step 3: Review & submit" },
                      ].map((s) => (
                        <button
                          key={s.step}
                          type="button"
                          onClick={() => setWizardStep(s.step as 1 | 2 | 3)}
                          className={`rounded-[10px] border px-3 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                            wizardStep === s.step
                              ? "border-[#292929] bg-[#292929] text-white"
                              : "border-[#E8E1D6] bg-[#F7F3EB] text-[#292929]"
                          }`}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STEP 1 */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Product Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={prodTitle}
                            onChange={(e) => setProdTitle(e.target.value)}
                            placeholder="e.g., Full-Stack System Design Handbook"
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-sm text-[#292929]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Category *
                          </label>
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value)}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#292929]"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Language
                          </label>
                          <input
                            type="text"
                            value={prodLanguage}
                            onChange={(e) => setProdLanguage(e.target.value)}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs text-[#292929]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Selling Price in INR (₹) *
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={prodPrice}
                            onChange={(e) => setProdPrice(Number(e.target.value))}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#292929]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Previous Price in INR (Optional)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={prodOriginalPrice}
                            onChange={(e) => setProdOriginalPrice(e.target.value)}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs text-[#292929]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Short Description *
                          </label>
                          <input
                            type="text"
                            value={prodShortDesc}
                            onChange={(e) => setProdShortDesc(e.target.value)}
                            placeholder="Concise 1–2 sentence summary for product cards"
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs text-[#292929]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Full Description *
                          </label>
                          <textarea
                            rows={4}
                            value={prodFullDesc}
                            onChange={(e) => setProdFullDesc(e.target.value)}
                            placeholder="Explain what customers will learn, chapters or templates included, and who this product is built for..."
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs text-[#292929]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Tags (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={prodTags}
                            onChange={(e) => setProdTags(e.target.value)}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2.5 text-xs text-[#292929]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (!prodTitle.trim()) {
                              showToast(
                                "Title Required",
                                "Please enter a product title before continuing to Step 2.",
                                "error"
                              );
                              return;
                            }
                            setWizardStep(2);
                          }}
                          className="btn-primary-glass px-5 py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          Continue to Step 2: Product Files →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {wizardStep === 2 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="liquid-glass-cream rounded-[14px] p-4 space-y-2">
                          <span className="text-xs font-bold text-[#292929] flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-[#292929]" />
                            1. Cover Artwork
                          </span>
                          <p className="text-[11px] text-[#524F49]">
                            High-contrast cover image (PNG, JPG, or SVG).
                          </p>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.webp"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) simulateAssetUpload(setCoverFileName, f.name);
                            }}
                            className="text-[11px] text-[#292929] w-full"
                          />
                          <p className="text-[11px] font-semibold text-[#287A52] truncate">
                            ✓ {coverFileName}
                          </p>
                        </div>

                        <div className="liquid-glass-cream rounded-[14px] p-4 space-y-2">
                          <span className="text-xs font-bold text-[#292929] flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-[#292929]" />
                            2. Digital Product File
                          </span>
                          <p className="text-[11px] text-[#524F49]">
                            Private PDF/EPUB delivered only to verified buyers.
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.epub,.zip"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) simulateAssetUpload(setDigitalFileName, f.name);
                            }}
                            className="text-[11px] text-[#292929] w-full"
                          />
                          <p className="text-[11px] font-semibold text-[#287A52] truncate">
                            ✓ {digitalFileName}
                          </p>
                        </div>

                        <div className="liquid-glass-cream rounded-[14px] p-4 space-y-2">
                          <span className="text-xs font-bold text-[#292929] flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-[#292929]" />
                            3. Sample Preview (Optional)
                          </span>
                          <p className="text-[11px] text-[#524F49]">
                            Free sample chapter excerpt for prospective readers.
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.txt"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) simulateAssetUpload(setPreviewFileName, f.name);
                            }}
                            className="text-[11px] text-[#292929] w-full"
                          />
                          <p className="text-[11px] font-semibold text-[#287A52] truncate">
                            ✓ {previewFileName}
                          </p>
                        </div>
                      </div>

                      {/* Upload Progress Bar */}
                      <div className="rounded-[12px] border border-[#E8E1D6] bg-white p-4 space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-[#292929]">
                          <span>Upload &amp; Verification Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EDE9DA]">
                          <div
                            className="h-full bg-[#287A52] transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Included Formats
                          </label>
                          <div className="flex gap-2">
                            {(["PDF", "EPUB"] as BookFormat[]).map((fmt) => {
                              const selected = prodFormats.includes(fmt);
                              return (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => {
                                    if (selected && prodFormats.length > 1) {
                                      setProdFormats(prodFormats.filter((f) => f !== fmt));
                                    } else if (!selected) {
                                      setProdFormats([...prodFormats, fmt]);
                                    }
                                  }}
                                  className={`rounded-[8px] border px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                                    selected
                                      ? "border-[#292929] bg-[#292929] text-white"
                                      : "border-[#E8E1D6] bg-white text-[#292929]"
                                  }`}
                                >
                                  {fmt}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#292929] mb-1">
                            Page Count / Resource Length
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={prodPages}
                            onChange={(e) => setProdPages(Number(e.target.value))}
                            className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pt-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="btn-secondary-glass px-4 py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="btn-primary-glass px-5 py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          Continue to Step 3: Review &amp; Submit →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {wizardStep === 3 && (
                    <div className="space-y-5">
                      <div className="liquid-glass-cream rounded-[14px] p-5 space-y-3 text-xs">
                        <h3 className="text-sm font-bold text-[#292929]">Submission Summary</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <p>
                            <span className="text-[#524F49]">Title:</span>{" "}
                            <strong className="text-[#292929]">{prodTitle || "Untitled"}</strong>
                          </p>
                          <p>
                            <span className="text-[#524F49]">Price:</span>{" "}
                            <strong className="text-[#292929]">₹{prodPrice}</strong>
                          </p>
                          <p>
                            <span className="text-[#524F49]">Formats:</span>{" "}
                            <strong className="text-[#292929]">{prodFormats.join(" + ")}</strong>
                          </p>
                          <p>
                            <span className="text-[#524F49]">Creator Net Payout:</span>{" "}
                            <strong className="text-[#287A52]">
                              ₹
                              {Math.round(
                                prodPrice * (1 - stats.commissionRatePercent / 100)
                              )}{" "}
                              per sale ({100 - stats.commissionRatePercent}%)
                            </strong>
                          </p>
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 text-xs text-[#292929] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rightsConfirmed}
                          onChange={(e) => setRightsConfirmed(e.target.checked)}
                          className="mt-0.5 accent-[#292929]"
                        />
                        <span>
                          I confirm that I am the original creator or authorized rights holder of
                          this work and that it complies with the ENOX Seller Guidelines.
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E1D6]">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="btn-secondary-glass px-4 py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          ← Back
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={submittingProduct}
                            onClick={() => handleProductSubmit("draft")}
                            className="btn-secondary-glass px-4 py-2.5 text-xs font-semibold cursor-pointer"
                          >
                            Save as Draft
                          </button>
                          <button
                            type="button"
                            disabled={submittingProduct}
                            onClick={() => handleProductSubmit("pending_review")}
                            className="btn-primary-glass px-5 py-2.5 text-xs font-semibold cursor-pointer"
                          >
                            {submittingProduct ? "Submitting..." : "Submit for Approval"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. SALES */}
              {activeTab === "sales" && (
                <div className="liquid-glass-strong rounded-[16px] p-6 space-y-4">
                  <h2 className="text-lg font-bold text-[#292929]">Product Sales History</h2>
                  {orders.length === 0 ? (
                    <p className="text-xs text-[#524F49]">No sales recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E1D6] text-[#524F49]">
                            <th className="py-3 pr-4">Order #</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Order Total</th>
                            <th className="py-3 pl-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E1D6]">
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td className="py-3 pr-4 font-semibold text-[#292929]">
                                {o.order_number}
                              </td>
                              <td className="py-3 px-4 text-[#524F49]">{o.customer_name}</td>
                              <td className="py-3 px-4 text-[#524F49]">
                                {new Date(o.created_at).toLocaleDateString("en-IN")}
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#292929]">
                                ₹{o.total_inr.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3 pl-4">
                                <span className="rounded-[6px] bg-[#287A52]/12 px-2 py-0.5 text-[11px] font-semibold text-[#287A52]">
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. EARNINGS */}
              {activeTab === "earnings" && (
                <div className="space-y-6">
                  <div className="liquid-glass-strong rounded-[16px] p-6 space-y-4">
                    <h2 className="text-lg font-bold text-[#292929]">
                      Earnings Ledger &amp; Commission Split
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E8E1D6] text-[#524F49]">
                            <th className="py-3 pr-4">Order</th>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4">Gross</th>
                            <th className="py-3 px-4">Platform Commission</th>
                            <th className="py-3 px-4">Your Net</th>
                            <th className="py-3 pl-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E1D6]">
                          {ledger.map((l) => (
                            <tr key={l.id}>
                              <td className="py-3 pr-4 font-semibold text-[#292929]">
                                {l.order_number}
                              </td>
                              <td className="py-3 px-4 text-[#524F49]">{l.book_title}</td>
                              <td className="py-3 px-4 text-[#292929]">₹{l.gross_inr}</td>
                              <td className="py-3 px-4 text-[#524F49]">
                                -₹{l.enox_commission_inr} ({l.commission_rate_percent}%)
                              </td>
                              <td className="py-3 px-4 font-bold text-[#287A52]">
                                ₹{l.creator_net_inr}
                              </td>
                              <td className="py-3 pl-4">
                                <span className="rounded-[6px] bg-[#EDE9DA] px-2 py-0.5 text-[11px] font-semibold text-[#292929]">
                                  {l.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="liquid-glass-strong rounded-[16px] p-6 space-y-4">
                    <h2 className="text-base font-bold text-[#292929]">Payout Records</h2>
                    {payouts.length === 0 ? (
                      <p className="text-xs text-[#524F49]">No completed payouts yet.</p>
                    ) : (
                      <div className="divide-y divide-[#E8E1D6] text-xs">
                        {payouts.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-wrap items-center justify-between py-3 gap-2"
                          >
                            <div>
                              <p className="font-semibold text-[#292929]">{p.period_label}</p>
                              <p className="text-[#524F49]">
                                {p.payout_method || "Verified Bank / UPI Settlement"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#287A52]">
                                ₹{p.amount_inr.toLocaleString("en-IN")}
                              </p>
                              <span className="text-[11px] text-[#77736D]">{p.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="liquid-glass-strong rounded-[16px] p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#292929]">Product Analytics</h2>
                    <p className="text-xs text-[#524F49]">
                      Unit sales, verified ratings, and gross revenue across your catalog.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {products.map((p) => {
                      const maxSales = Math.max(1, ...products.map((b) => b.sales_count));
                      const pct = Math.round((p.sales_count / maxSales) * 100);
                      return (
                        <div key={p.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#292929]">{p.title}</span>
                            <span className="text-[#524F49]">
                              {p.sales_count} sales · ₹
                              {(p.sales_count * p.price_inr).toLocaleString("en-IN")} gross
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EDE9DA]">
                            <div
                              className="h-full bg-[#292929] rounded-full"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. SUBSCRIPTION */}
              {activeTab === "subscription" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Free Creator Card */}
                    <div
                      className={`liquid-glass-strong rounded-[18px] p-6 flex flex-col justify-between ${
                        creator?.plan_tier === "free" ? "border-2 border-[#292929]" : ""
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#524F49]">
                            Free Creator
                          </span>
                          {creator?.plan_tier === "free" && (
                            <span className="rounded-[6px] bg-[#292929] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                              Current Plan
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-[#292929]">₹0</span>
                          <span className="text-xs text-[#77736D]">/ month</span>
                        </div>
                        <ul className="space-y-2 text-xs text-[#292929]">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#292929]" /> Maximum 5 active
                            product listings
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#292929]" /> 30% platform
                            commission
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#292929]" /> Basic sales dashboard
                            &amp; creator profile
                          </li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        disabled={creator?.plan_tier === "free" || updatingPlan}
                        onClick={() => handlePlanChange("free")}
                        className="btn-secondary-glass mt-6 w-full py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {creator?.plan_tier === "free" ? "Active Plan" : "Switch to Free"}
                      </button>
                    </div>

                    {/* ENOX Premium Card */}
                    <div
                      className={`liquid-glass-strong rounded-[18px] p-6 flex flex-col justify-between ${
                        creator?.plan_tier === "premium" ? "border-2 border-[#292929]" : ""
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#292929]">
                            ENOX Premium
                          </span>
                          {creator?.plan_tier === "premium" && (
                            <span className="rounded-[6px] bg-[#287A52] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                              Current Plan
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-[#292929]">₹999</span>
                          <span className="text-xs text-[#77736D]">/ month</span>
                        </div>
                        <ul className="space-y-2 text-xs text-[#292929]">
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#287A52]" /> Maximum 25 active
                            product listings
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#287A52]" /> 20% platform
                            commission
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#287A52]" /> Premium badge &amp;
                            eligibility for priority placement
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-[#287A52]" /> Advanced analytics
                            &amp; priority support
                          </li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        disabled={creator?.plan_tier === "premium" || updatingPlan}
                        onClick={() => handlePlanChange("premium")}
                        className="btn-primary-glass mt-6 w-full py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {creator?.plan_tier === "premium"
                          ? "Active Premium Plan"
                          : "Upgrade to Premium"}
                      </button>
                    </div>
                  </div>

                  <div className="liquid-glass-cream rounded-[14px] p-5 text-xs text-[#292929] space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#292929]" />
                      Transparent Plan &amp; Expiry Terms
                    </p>
                    <p className="text-[#524F49]">
                      Priority placement eligibility is subject to editorial quality review and does
                      not guarantee search rankings or sales. If ENOX Premium expires or downgrades
                      to Free,{" "}
                      <strong className="text-[#292929]">
                        products above 5 become temporarily unlisted, never deleted.
                      </strong>
                    </p>
                  </div>
                </div>
              )}

              {/* 8. SETTINGS */}
              {activeTab === "settings" && (
                <form
                  onSubmit={handleSaveStorefront}
                  className="liquid-glass-strong rounded-[16px] p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#292929]">
                        Creator Profile &amp; Payout Settings
                      </h2>
                      <p className="text-xs text-[#524F49]">
                        Manage your public creator identity and INR payout settlement preferences.
                      </p>
                    </div>
                    {creator && (
                      <Link
                        href={`/creators/${creator.slug}`}
                        className="text-xs font-semibold text-[#7C8665] hover:underline"
                      >
                        View `/creators/{creator.slug}` →
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#292929] mb-1">
                        Creator Name
                      </label>
                      <input
                        type="text"
                        value={sfName}
                        onChange={(e) => setSfName(e.target.value)}
                        className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#292929] mb-1">
                        Specialty / Headline
                      </label>
                      <input
                        type="text"
                        value={sfTagline}
                        onChange={(e) => setSfTagline(e.target.value)}
                        className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#292929] mb-1">
                        Creator Bio
                      </label>
                      <textarea
                        rows={3}
                        value={sfBio}
                        onChange={(e) => setSfBio(e.target.value)}
                        className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#292929] mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={sfLocation}
                        onChange={(e) => setSfLocation(e.target.value)}
                        className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#292929] mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        value={sfWebsite}
                        onChange={(e) => setSfWebsite(e.target.value)}
                        className="w-full rounded-[10px] border border-[#E8E1D6] bg-white px-3.5 py-2 text-xs text-[#292929]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingStorefront}
                    className="btn-primary-glass px-5 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    {savingStorefront ? "Saving..." : "Save Settings"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#524F49]">
          Loading Creator Dashboard...
        </div>
      }
    >
      <CreatorWorkspaceInner />
    </Suspense>
  );
}
