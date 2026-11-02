import { NextResponse } from "next/server";
import { getServerSessionUser, setServerSessionCookie } from "@/lib/auth/session";
import {
  getCategoriesWithCounts,
  readDb,
  updateCustomerProfile,
  upsertBookAdmin,
  writeDb,
} from "@/lib/db/store";
import { sanitizeText } from "@/lib/security/crypto";
import type { CreatorPlanTier, CreatorProfile } from "@/types/enox";

function normalizeCreator(c: CreatorProfile): CreatorProfile {
  const plan = c.plan_tier || c.plan || "free";
  return {
    ...c,
    initials: c.initials || c.avatar_initials || c.name.slice(0, 2).toUpperCase(),
    avatar_initials: c.avatar_initials || c.initials || c.name.slice(0, 2).toUpperCase(),
    tagline: c.tagline || c.specialty || "Digital Product Creator on ENOX",
    specialty: c.specialty || c.tagline || "Digital Product Creator on ENOX",
    bio: c.bio || c.short_bio || "Publishing verified digital resources on ENOX.",
    short_bio: c.short_bio || c.bio || "Publishing verified digital resources on ENOX.",
    plan,
    plan_tier: plan,
    joined_date: c.joined_date || (c.joined_at ? c.joined_at.slice(0, 10) : "2026-08-01"),
  };
}

export async function GET() {
  const user = await getServerSessionUser();
  const db = readDb();

  const activeCreatorSlug = user?.creator_slug || "aarav-mehta";
  let foundCreator = db.creators.find((c) => c.slug === activeCreatorSlug);

  if (!foundCreator && user) {
    const plan: CreatorPlanTier = user.creator_plan || "free";
    foundCreator = {
      id: `cr-${user.id}`,
      user_id: user.id,
      slug: activeCreatorSlug,
      name: user.full_name,
      initials: user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      avatar_initials: user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      tagline: "Digital Product Creator on ENOX",
      specialty: "Digital Product Creator on ENOX",
      bio: user.bio || "Creating practical digital guides, templates, and resources on ENOX.",
      short_bio: user.bio || "Creating practical digital guides, templates, and resources on ENOX.",
      avatar_bg: "#292929",
      plan,
      plan_tier: plan,
      max_active_listings: plan === "premium" ? 25 : 5,
      commission_rate_percent: plan === "premium" ? 20 : 30,
      joined_date: user.created_at.slice(0, 10),
      joined_at: user.created_at,
    };
  }

  const creatorProfile = normalizeCreator(foundCreator || db.creators[0]);

  const creatorBooks = db.books.filter(
    (b) =>
      b.creator_slug === creatorProfile.slug ||
      (user && b.author.toLowerCase() === user.full_name.toLowerCase())
  );

  const creatorBookIds = new Set(creatorBooks.map((b) => b.id));
  const creatorOrders = db.orders.filter((o) =>
    o.items.some((i) => creatorBookIds.has(i.book_id))
  );
  const creatorLedger = db.earnings_ledger.filter(
    (l) => l.creator_slug === creatorProfile.slug || creatorBookIds.has(l.book_id)
  );
  const creatorPayouts = db.payout_records.filter(
    (p) => p.creator_slug === creatorProfile.slug
  );

  const activePublishedCount = creatorBooks.filter((b) => b.status === "published").length;
  const pendingReviewCount = creatorBooks.filter((b) => b.status === "pending_review").length;
  const unlistedCount = creatorBooks.filter((b) => b.status === "unlisted").length;

  const grossSalesInr = creatorLedger
    .filter((l) => l.status !== "reversed")
    .reduce((sum, l) => sum + l.gross_inr, 0);
  const enoxCommissionInr = creatorLedger
    .filter((l) => l.status !== "reversed")
    .reduce((sum, l) => sum + l.enox_commission_inr, 0);
  const netEarningsInr = creatorLedger
    .filter((l) => l.status !== "reversed")
    .reduce((sum, l) => sum + l.creator_net_inr, 0);

  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    creator: creatorProfile,
    stats: {
      activePublishedCount,
      pendingReviewCount,
      unlistedCount,
      totalProductsCount: creatorBooks.length,
      maxActiveListings: creatorProfile.max_active_listings,
      commissionRatePercent: creatorProfile.commission_rate_percent,
      grossSalesInr,
      enoxCommissionInr,
      netEarningsInr,
      totalSalesUnits: creatorBooks.reduce((sum, b) => sum + b.sales_count, 0),
    },
    products: creatorBooks,
    orders: creatorOrders,
    earningsLedger: creatorLedger,
    payoutRecords: creatorPayouts,
    categories: getCategoriesWithCounts(),
  });
}

export async function POST(request: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to submit products or update your creator workspace." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const action = String(body.action || "");
    const db = readDb();
    const creatorSlug = user.creator_slug || "aarav-mehta";

    let foundCreator = db.creators.find((c) => c.slug === creatorSlug);
    if (!foundCreator) {
      const plan: CreatorPlanTier = user.creator_plan || "free";
      const created: CreatorProfile = {
        id: `cr-${user.id}`,
        user_id: user.id,
        slug: creatorSlug,
        name: user.full_name,
        initials: user.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        avatar_initials: user.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        tagline: "Digital Product Creator on ENOX",
        specialty: "Digital Product Creator on ENOX",
        bio: user.bio || "Publishing practical ebooks and digital resources on ENOX.",
        short_bio: user.bio || "Publishing practical ebooks and digital resources on ENOX.",
        avatar_bg: "#292929",
        plan,
        plan_tier: plan,
        max_active_listings: plan === "premium" ? 25 : 5,
        commission_rate_percent: plan === "premium" ? 20 : 30,
        joined_date: user.created_at.slice(0, 10),
        joined_at: user.created_at,
      };
      db.creators.push(created);
      writeDb(db);
      foundCreator = created;
    }

    const creator = foundCreator;

    if (action === "submit_product") {
      const activeCount = db.books.filter(
        (b) =>
          b.creator_slug === creator.slug &&
          (b.status === "published" || b.status === "pending_review")
      ).length;

      const requestedStatus = body.status === "draft" ? "draft" : "pending_review";
      const currentPlan = creator.plan_tier || creator.plan || "free";
      if (
        requestedStatus === "pending_review" &&
        activeCount >= creator.max_active_listings
      ) {
        return NextResponse.json(
          {
            error: `You have reached the maximum active listing limit (${creator.max_active_listings}) for your ${
              currentPlan === "premium" ? "ENOX Premium" : "Free Creator"
            } plan. Upgrade to ENOX Premium (up to 25 active listings) or save as draft.`,
          },
          { status: 400 }
        );
      }

      const res = upsertBookAdmin({
        title: String(body.title || ""),
        subtitle: String(body.subtitle || ""),
        author: creator.name,
        creator_slug: creator.slug,
        author_bio: creator.bio || creator.short_bio || "",
        short_description: String(body.short_description || ""),
        full_description: String(body.full_description || ""),
        category_id: String(body.category_id || "cat-ebooks"),
        price_inr: Number(body.price_inr || 499),
        original_price_inr: body.original_price_inr ? Number(body.original_price_inr) : null,
        formats: Array.isArray(body.formats) && body.formats.length > 0 ? body.formats : ["PDF"],
        pages: Number(body.pages || 120),
        language: String(body.language || "English"),
        highlights: Array.isArray(body.highlights) ? body.highlights : [],
        status: requestedStatus,
        is_demo: false,
      });

      if (res.error) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, book: res.book });
    }

    if (action === "update_plan") {
      const nextPlan: CreatorPlanTier = body.plan === "premium" ? "premium" : "free";
      creator.plan = nextPlan;
      creator.plan_tier = nextPlan;
      creator.max_active_listings = nextPlan === "premium" ? 25 : 5;
      creator.commission_rate_percent = nextPlan === "premium" ? 20 : 30;
      writeDb(db);

      const updatedUser = updateCustomerProfile(user.id, { creator_plan: nextPlan });
      if (updatedUser) {
        await setServerSessionCookie(updatedUser);
      }

      return NextResponse.json({
        ok: true,
        creator: normalizeCreator(creator),
        user: updatedUser,
      });
    }

    if (action === "update_storefront") {
      if (typeof body.name === "string" && body.name.trim()) {
        creator.name = sanitizeText(body.name, 80);
      }
      if (typeof body.tagline === "string") {
        creator.tagline = sanitizeText(body.tagline, 140);
        creator.specialty = creator.tagline;
      }
      if (typeof body.bio === "string") {
        creator.bio = sanitizeText(body.bio, 600);
        creator.short_bio = creator.bio;
      }
      if (typeof body.location === "string") {
        creator.location = sanitizeText(body.location, 80);
      }
      if (typeof body.website === "string") {
        creator.website = sanitizeText(body.website, 140);
      }
      writeDb(db);
      return NextResponse.json({ ok: true, creator: normalizeCreator(creator) });
    }

    return NextResponse.json({ error: "Unknown creator action." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process creator request." },
      { status: 500 }
    );
  }
}
