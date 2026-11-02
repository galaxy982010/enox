import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Book,
  BookFormat,
  BookStatus,
  Category,
  ContactMessage,
  CopyrightReport,
  CreatorPayoutRecord,
  CreatorPlanTier,
  CreatorProfile,
  DownloadAuditLog,
  EarningsLedgerEntry,
  LegalPage,
  LibraryEntry,
  NewsletterSubscriber,
  Order,
  OrderItem,
  PaymentRecord,
  Promotion,
  Review,
  SupportRequest,
  UserProfile,
  WebhookEventRecord,
  WishlistItem,
} from "@/types/enox";
import {
  getInitialBooks,
  getInitialCategories,
  getInitialCreators,
  getInitialEarningsLedger,
  getInitialLegalPages,
  getInitialLibrary,
  getInitialOrders,
  getInitialPayments,
  getInitialPayoutRecords,
  getInitialPromotions,
  getInitialReviews,
  getInitialUsers,
  type StoredUserRecord,
} from "./seed";
import { hashPassword, sanitizeText, verifyPassword } from "@/lib/security/crypto";

export interface DatabaseSchema {
  schema_version?: number;
  users: StoredUserRecord[];
  creators: CreatorProfile[];
  categories: Category[];
  books: Book[];
  promotions: Promotion[];
  orders: Order[];
  payments: PaymentRecord[];
  webhook_events: WebhookEventRecord[];
  user_library: LibraryEntry[];
  download_audit_logs: DownloadAuditLog[];
  wishlists: WishlistItem[];
  reviews: Review[];
  newsletter_subscribers: NewsletterSubscriber[];
  contact_messages: ContactMessage[];
  legal_pages: LegalPage[];
  copyright_reports: CopyrightReport[];
  support_requests: SupportRequest[];
  earnings_ledger: EarningsLedgerEntry[];
  payout_records: CreatorPayoutRecord[];
}

const CURRENT_SCHEMA_VERSION = 2;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "enox-db.json");
const PRIVATE_EBOOKS_DIR = path.join(process.cwd(), "private_storage", "ebooks");

export function generateValidPdfBuffer(book: {
  title: string;
  subtitle?: string;
  author: string;
  isbn?: string;
  sample_pages?: { chapter_number: number; chapter_title: string; content: string }[];
}): Buffer {
  const escapePdfText = (str: string) =>
    str
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const chapter1 =
    book.sample_pages?.[0]?.content ||
    "Thank you for purchasing this official ENOX Ebooks digital edition. All rights reserved.";
  const lines = [
    "ENOX EBOOKS - VERIFIED LICENSED EDITION",
    "Discover Ideas Worth Investing In.",
    "------------------------------------------------------------",
    `Title: ${book.title.slice(0, 72)}`,
    `Creator: ${book.author.slice(0, 72)}`,
    `ISBN: ${book.isbn || "978-81-974021-0-0"}`,
    "------------------------------------------------------------",
    `Chapter 1: ${book.sample_pages?.[0]?.chapter_title || "Introduction"}`,
    "",
  ];

  const words = chapter1.split(/\s+/);
  let currentLine = "";
  for (const w of words) {
    if ((currentLine + " " + w).trim().length > 76) {
      lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + " " + w).trim();
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  lines.push("");
  lines.push("------------------------------------------------------------");
  lines.push("Licensed for personal reference via ENOX Ebooks.");

  const textOps = lines
    .map((line, index) => {
      const y = 740 - index * 20;
      return `1 0 0 1 54 ${y} Tm (${escapePdfText(line)}) Tj`;
    })
    .join("\n");

  const streamContent = `BT\n/F1 11 Tf\n${textOps}\nET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "utf8")} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

export function generateValidEpubBuffer(book: {
  title: string;
  author: string;
  isbn?: string;
  sample_pages?: { chapter_number: number; chapter_title: string; content: string }[];
}): Buffer {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <title>${sanitizeText(book.title, 200)} — ENOX EPUB3 Edition</title>
</head>
<body>
  <header>
    <p>ENOX Ebooks — Discover Ideas Worth Investing In.</p>
    <h1>${sanitizeText(book.title, 200)}</h1>
    <p>By ${sanitizeText(book.author, 150)} | ISBN: ${sanitizeText(book.isbn || "", 40)}</p>
  </header>
  <main>
    ${(book.sample_pages || [])
      .map(
        (ch) =>
          `<section><h2>Chapter ${ch.chapter_number}: ${sanitizeText(ch.chapter_title, 150)}</h2><p>${sanitizeText(ch.content, 4000)}</p></section>`
      )
      .join("\n")}
  </main>
</body>
</html>`;
  return Buffer.from(content, "utf8");
}

function ensurePrivateFilesExist(books: Book[]) {
  if (!fs.existsSync(PRIVATE_EBOOKS_DIR)) {
    fs.mkdirSync(PRIVATE_EBOOKS_DIR, { recursive: true });
  }
  for (const book of books) {
    if (book.private_pdf_path) {
      const pdfFullPath = path.join(PRIVATE_EBOOKS_DIR, path.basename(book.private_pdf_path));
      if (!fs.existsSync(pdfFullPath)) {
        fs.writeFileSync(pdfFullPath, generateValidPdfBuffer(book));
      }
    }
    if (book.private_epub_path) {
      const epubFullPath = path.join(PRIVATE_EBOOKS_DIR, path.basename(book.private_epub_path));
      if (!fs.existsSync(epubFullPath)) {
        fs.writeFileSync(epubFullPath, generateValidEpubBuffer(book));
      }
    }
  }
}

function recalculateBookRatingsInMemory(db: DatabaseSchema) {
  for (const book of db.books) {
    const publishedReviews = db.reviews.filter(
      (r) => r.book_id === book.id && r.status === "published"
    );
    book.review_count = publishedReviews.length;
    if (publishedReviews.length === 0) {
      book.rating_avg = 0;
    } else {
      const sum = publishedReviews.reduce((acc, r) => acc + r.rating, 0);
      book.rating_avg = Number((sum / publishedReviews.length).toFixed(2));
    }
  }
}

function buildFreshDatabase(): DatabaseSchema {
  const initialBooks = getInitialBooks();
  const initial: DatabaseSchema = {
    schema_version: CURRENT_SCHEMA_VERSION,
    users: getInitialUsers(),
    creators: getInitialCreators(),
    categories: getInitialCategories(),
    books: initialBooks,
    promotions: getInitialPromotions(),
    orders: getInitialOrders(),
    payments: getInitialPayments(),
    webhook_events: [],
    user_library: getInitialLibrary(),
    download_audit_logs: [],
    wishlists: [],
    reviews: getInitialReviews(),
    newsletter_subscribers: [],
    contact_messages: [],
    legal_pages: getInitialLegalPages(),
    copyright_reports: [],
    support_requests: [],
    earnings_ledger: getInitialEarningsLedger(),
    payout_records: getInitialPayoutRecords(),
  };
  recalculateBookRatingsInMemory(initial);
  ensurePrivateFilesExist(initialBooks);
  return initial;
}

export function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = buildFreshDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf8");
  const parsed = JSON.parse(raw) as DatabaseSchema;
  if (parsed.schema_version !== CURRENT_SCHEMA_VERSION) {
    const upgraded = buildFreshDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(upgraded, null, 2), "utf8");
    return upgraded;
  }
  ensurePrivateFilesExist(parsed.books);
  return parsed;
}

export function writeDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  db.schema_version = CURRENT_SCHEMA_VERSION;
  recalculateBookRatingsInMemory(db);
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmpFile, DB_FILE);
}

// ============================================================================
// CATALOG QUERIES (PUBLIC vs ADMIN)
// ============================================================================

export interface CatalogQueryFilters {
  q?: string;
  category?: string;
  creatorSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  format?: BookFormat | "ALL";
  featuredOnly?: boolean;
  bestsellerOnly?: boolean;
  sort?: "featured" | "newest" | "popularity" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}

export function getPublishedBooks(filters: CatalogQueryFilters = {}): {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const db = readDb();
  // STRICT SECURITY RULE: Only published products ever appear publicly
  let list = db.books.filter((b) => b.status === "published");

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.short_description.toLowerCase().includes(q) ||
        b.category_name.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== "all") {
    list = list.filter(
      (b) => b.category_slug === filters.category || b.category_id === filters.category
    );
  }

  if (filters.creatorSlug) {
    list = list.filter((b) => b.creator_slug === filters.creatorSlug);
  }

  if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice)) {
    list = list.filter((b) => b.price_inr >= filters.minPrice!);
  }

  if (
    typeof filters.maxPrice === "number" &&
    !Number.isNaN(filters.maxPrice) &&
    filters.maxPrice > 0
  ) {
    list = list.filter((b) => b.price_inr <= filters.maxPrice!);
  }

  if (typeof filters.minRating === "number" && filters.minRating > 0) {
    list = list.filter((b) => b.rating_avg >= filters.minRating!);
  }

  if (filters.format && filters.format !== "ALL") {
    list = list.filter((b) => b.formats.includes(filters.format as BookFormat));
  }

  if (filters.featuredOnly) {
    list = list.filter((b) => b.is_featured);
  }

  if (filters.bestsellerOnly) {
    list = list.filter((b) => b.is_bestseller);
  }

  const sort = filters.sort || "featured";
  list.sort((a, b) => {
    if (sort === "price_asc") return a.price_inr - b.price_inr;
    if (sort === "price_desc") return b.price_inr - a.price_inr;
    if (sort === "newest") {
      return new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime();
    }
    if (sort === "popularity") return b.sales_count - a.sales_count;
    if (sort === "rating") {
      if (b.rating_avg !== a.rating_avg) return b.rating_avg - a.rating_avg;
      return b.review_count - a.review_count;
    }
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return b.sales_count - a.sales_count;
  });

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, Math.min(48, filters.pageSize || 12));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = list.slice(start, start + pageSize);

  return {
    books: paged,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function getPublishedBookBySlug(slug: string): Book | null {
  const db = readDb();
  const book = db.books.find((b) => b.slug === slug && b.status === "published");
  return book || null;
}

export function getPublishedBookById(id: string): Book | null {
  const db = readDb();
  return db.books.find((b) => b.id === id && b.status === "published") || null;
}

export function getCategoriesWithCounts(): Category[] {
  const db = readDb();
  return db.categories
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cat) => ({
      ...cat,
      book_count: db.books.filter(
        (b) => b.category_id === cat.id && b.status === "published"
      ).length,
    }));
}

export function getCreatorsWithProducts(): (CreatorProfile & {
  published_products_count: number;
})[] {
  const db = readDb();
  return db.creators.map((c) => {
    const plan = c.plan_tier || c.plan || "free";
    return {
      ...c,
      initials: c.initials || c.avatar_initials || c.name.slice(0, 2).toUpperCase(),
      tagline: c.tagline || c.specialty || "Digital Product Creator",
      bio: c.bio || c.short_bio || "",
      plan_tier: plan,
      joined_date: c.joined_date || (c.joined_at ? c.joined_at.slice(0, 10) : "2026-08-01"),
      published_products_count: db.books.filter(
        (b) => b.creator_slug === c.slug && b.status === "published"
      ).length,
    };
  });
}

export function getCreatorBySlug(slug: string): {
  creator: CreatorProfile;
  products: Book[];
} | null {
  const db = readDb();
  const c = db.creators.find((cr) => cr.slug === slug);
  if (!c) return null;
  const plan = c.plan_tier || c.plan || "free";
  const creator: CreatorProfile = {
    ...c,
    initials: c.initials || c.avatar_initials || c.name.slice(0, 2).toUpperCase(),
    tagline: c.tagline || c.specialty || "Digital Product Creator",
    bio: c.bio || c.short_bio || "",
    plan_tier: plan,
    joined_date: c.joined_date || (c.joined_at ? c.joined_at.slice(0, 10) : "2026-08-01"),
  };
  const products = db.books.filter(
    (b) => b.creator_slug === slug && b.status === "published"
  );
  return { creator, products };
}

export function getActivePromotions(): Promotion[] {
  const db = readDb();
  const now = Date.now();
  return db.promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.expires_at && new Date(p.expires_at).getTime() < now) return false;
    return true;
  });
}

// ============================================================================
// AUTHENTICATION & USER ACCOUNTS
// ============================================================================

export function toPublicUserProfile(user: StoredUserRecord): UserProfile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    bio: user.bio,
    role: user.role,
    creator_slug: user.creator_slug,
    creator_plan: user.creator_plan || "free",
    newsletter_consent: user.newsletter_consent,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function getUserById(userId: string): UserProfile | null {
  const db = readDb();
  const found = db.users.find((u) => u.id === userId);
  return found ? toPublicUserProfile(found) : null;
}

export function authenticateUser(email: string, password: string): UserProfile | null {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return toPublicUserProfile(user);
}

export function registerCustomer(params: {
  email: string;
  password: string;
  fullName: string;
  newsletterConsent?: boolean;
}): { user?: UserProfile; error?: string } {
  const db = readDb();
  const normalized = params.email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "Please enter a valid email address." };
  }
  if (!params.password || params.password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }
  const existing = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (existing) {
    return { error: "An account with this email address already exists." };
  }

  const now = new Date().toISOString();
  const cleanName = sanitizeText(params.fullName || normalized.split("@")[0], 80);
  const creatorSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const newUser: StoredUserRecord = {
    id: `user-${crypto.randomUUID()}`,
    email: normalized,
    full_name: cleanName,
    bio: "",
    role: "customer",
    creator_slug: `${creatorSlug}-${Math.floor(100 + Math.random() * 899)}`,
    creator_plan: "free",
    newsletter_consent: Boolean(params.newsletterConsent),
    password_hash: hashPassword(params.password),
    created_at: now,
    updated_at: now,
  };

  db.users.push(newUser);
  if (newUser.newsletter_consent) {
    const subExists = db.newsletter_subscribers.some((s) => s.email === normalized);
    if (!subExists) {
      db.newsletter_subscribers.push({
        id: `sub-${crypto.randomUUID()}`,
        email: normalized,
        consent_given: true,
        consent_timestamp: now,
        status: "subscribed",
      });
    }
  }
  writeDb(db);
  return { user: toPublicUserProfile(newUser) };
}

export function updateCustomerProfile(
  userId: string,
  updates: {
    full_name?: string;
    bio?: string;
    newsletter_consent?: boolean;
    creator_plan?: CreatorPlanTier;
  }
): UserProfile | null {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  if (typeof updates.full_name === "string" && updates.full_name.trim()) {
    user.full_name = sanitizeText(updates.full_name, 80);
  }
  if (typeof updates.bio === "string") {
    user.bio = sanitizeText(updates.bio, 500);
  }
  if (typeof updates.newsletter_consent === "boolean") {
    user.newsletter_consent = updates.newsletter_consent;
  }
  if (updates.creator_plan === "free" || updates.creator_plan === "premium") {
    const previousPlan = user.creator_plan || "free";
    user.creator_plan = updates.creator_plan;

    // Enforce ENOX Plan Policy: If downgrading/expiring from Premium to Free,
    // active products above the 5-listing Free limit become temporarily 'unlisted', never deleted!
    if (previousPlan === "premium" && updates.creator_plan === "free" && user.creator_slug) {
      const activeListings = db.books.filter(
        (b) =>
          (b.creator_slug === user.creator_slug || b.author === user.full_name) &&
          b.status === "published"
      );
      if (activeListings.length > 5) {
        for (const extraBook of activeListings.slice(5)) {
          extraBook.status = "unlisted";
        }
      }
    }
  }
  user.updated_at = new Date().toISOString();
  writeDb(db);
  return toPublicUserProfile(user);
}

export function updateCustomerPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { ok: boolean; error?: string } {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "User not found." };
  if (!verifyPassword(currentPassword, user.password_hash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  user.password_hash = hashPassword(newPassword);
  user.updated_at = new Date().toISOString();
  writeDb(db);
  return { ok: true };
}

export function issuePasswordResetToken(email: string): {
  issued: boolean;
  demoResetCode?: string;
} {
  const db = readDb();
  const normalized = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) {
    return { issued: true };
  }
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  user.reset_token = code;
  user.reset_token_exp = Date.now() + 15 * 60 * 1000;
  writeDb(db);
  return { issued: true, demoResetCode: code };
}

export function completePasswordReset(params: {
  email: string;
  token: string;
  newPassword: string;
}): { ok: boolean; error?: string } {
  if (!params.newPassword || params.newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  const db = readDb();
  const normalized = params.email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  if (
    !user ||
    !user.reset_token ||
    !user.reset_token_exp ||
    user.reset_token_exp < Date.now() ||
    user.reset_token.toUpperCase() !== params.token.trim().toUpperCase()
  ) {
    return { ok: false, error: "Invalid or expired password reset code." };
  }
  user.password_hash = hashPassword(params.newPassword);
  user.reset_token = null;
  user.reset_token_exp = null;
  user.updated_at = new Date().toISOString();
  writeDb(db);
  return { ok: true };
}

// ============================================================================
// SERVER-SIDE CART & CHECKOUT VALIDATION
// ============================================================================

export interface ServerValidatedCart {
  items: {
    book: Book;
    unitPriceInr: number;
    originalPriceInr: number | null;
    alreadyOwned: boolean;
  }[];
  purchasableItems: {
    book: Book;
    unitPriceInr: number;
  }[];
  alreadyOwnedBookIds: string[];
  unavailableBookIds: string[];
  subtotalInr: number;
  discountInr: number;
  totalInr: number;
  appliedPromo: Promotion | null;
  promoError: string | null;
}

export function validateCartOnServer(params: {
  bookIds: string[];
  promoCode?: string | null;
  userId?: string | null;
}): ServerValidatedCart {
  const db = readDb();
  const uniqueIds = Array.from(new Set((params.bookIds || []).filter(Boolean)));
  const ownedSet = new Set<string>();
  if (params.userId) {
    for (const entry of db.user_library) {
      if (entry.user_id === params.userId && entry.status === "active") {
        ownedSet.add(entry.book_id);
      }
    }
  }

  const items: ServerValidatedCart["items"] = [];
  const unavailableBookIds: string[] = [];
  const alreadyOwnedBookIds: string[] = [];

  for (const id of uniqueIds) {
    const book = db.books.find((b) => b.id === id && b.status === "published");
    if (!book) {
      unavailableBookIds.push(id);
      continue;
    }
    const alreadyOwned = ownedSet.has(book.id);
    if (alreadyOwned) {
      alreadyOwnedBookIds.push(book.id);
    }
    items.push({
      book,
      unitPriceInr: book.price_inr,
      originalPriceInr: book.original_price_inr,
      alreadyOwned,
    });
  }

  const purchasableItems = items
    .filter((i) => !i.alreadyOwned)
    .map((i) => ({ book: i.book, unitPriceInr: i.unitPriceInr }));

  const subtotalInr = purchasableItems.reduce((sum, i) => sum + i.unitPriceInr, 0);
  let discountInr = 0;
  let appliedPromo: Promotion | null = null;
  let promoError: string | null = null;

  if (params.promoCode && params.promoCode.trim()) {
    const code = params.promoCode.trim().toUpperCase();
    const promo = db.promotions.find((p) => p.code.toUpperCase() === code);
    if (!promo || !promo.is_active) {
      promoError = `Promo code "${code}" is invalid or inactive.`;
    } else if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      promoError = `Promo code "${code}" has expired.`;
    } else if (subtotalInr < promo.min_order_inr) {
      promoError = `Code "${code}" requires a minimum order of ₹${promo.min_order_inr}.`;
    } else if (subtotalInr > 0) {
      appliedPromo = promo;
      if (promo.discount_type === "percentage") {
        const raw = Math.round((subtotalInr * promo.discount_value) / 100);
        discountInr = promo.max_discount_inr ? Math.min(raw, promo.max_discount_inr) : raw;
      } else {
        discountInr = promo.discount_value;
      }
      discountInr = Math.min(discountInr, subtotalInr);
    }
  }

  const totalInr = Math.max(0, subtotalInr - discountInr);

  return {
    items,
    purchasableItems,
    alreadyOwnedBookIds,
    unavailableBookIds,
    subtotalInr,
    discountInr,
    totalInr,
    appliedPromo,
    promoError,
  };
}

// ============================================================================
// ORDERS, RAZORPAY VERIFICATION, WEBHOOKS & LIBRARY OWNERSHIP
// ============================================================================

export function createServerPendingOrder(params: {
  userId: string;
  bookIds: string[];
  promoCode?: string | null;
  razorpayOrderId: string;
}): { order?: Order; error?: string } {
  const db = readDb();
  const user = db.users.find((u) => u.id === params.userId);
  if (!user) return { error: "Authenticated user not found." };

  const validated = validateCartOnServer({
    bookIds: params.bookIds,
    promoCode: params.promoCode,
    userId: params.userId,
  });

  if (validated.unavailableBookIds.length > 0) {
    return { error: "One or more selected products are no longer available for sale." };
  }
  if (validated.alreadyOwnedBookIds.length > 0 && validated.purchasableItems.length === 0) {
    return { error: "You already own the selected product(s) in your ENOX Library." };
  }
  if (validated.purchasableItems.length === 0) {
    return { error: "Your cart has no purchasable products." };
  }

  const now = new Date().toISOString();
  const orderId = `ord-${crypto.randomUUID()}`;
  const orderNumber = `ENX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const orderItems: OrderItem[] = validated.purchasableItems.map((item) => ({
    id: `item-${crypto.randomUUID()}`,
    order_id: orderId,
    book_id: item.book.id,
    book_slug: item.book.slug,
    title_snapshot: item.book.title,
    author_snapshot: item.book.author,
    cover_snapshot: item.book.cover_image,
    unit_price_inr: item.unitPriceInr,
    quantity: 1,
  }));

  const order: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: user.id,
    customer_email: user.email,
    customer_name: user.full_name,
    subtotal_inr: validated.subtotalInr,
    discount_inr: validated.discountInr,
    total_inr: validated.totalInr,
    currency: "INR",
    promo_code: validated.appliedPromo?.code || null,
    status: "pending",
    payment_status: "pending",
    razorpay_order_id: params.razorpayOrderId,
    razorpay_payment_id: null,
    items: orderItems,
    created_at: now,
    updated_at: now,
  };

  const paymentRecord: PaymentRecord = {
    id: `pay-${crypto.randomUUID()}`,
    order_id: order.id,
    user_id: user.id,
    provider: "razorpay",
    razorpay_order_id: params.razorpayOrderId,
    razorpay_payment_id: null,
    amount_inr: order.total_inr,
    currency: "INR",
    status: "created",
    signature_verified: false,
    webhook_confirmed: false,
    method: null,
    failure_reason: null,
    created_at: now,
    updated_at: now,
  };

  db.orders.unshift(order);
  db.payments.unshift(paymentRecord);
  writeDb(db);

  return { order };
}

export function fulfillVerifiedOrderPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  expectedUserId?: string;
  signatureVerified?: boolean;
  webhookConfirmed?: boolean;
  method?: string;
}): { order?: Order; alreadyFulfilled?: boolean; error?: string } {
  const db = readDb();
  const order = db.orders.find((o) => o.razorpay_order_id === params.razorpayOrderId);
  if (!order) {
    return { error: "Order matching Razorpay Order ID not found." };
  }
  if (params.expectedUserId && order.user_id !== params.expectedUserId) {
    return { error: "Order ownership mismatch." };
  }
  if (order.status === "refunded") {
    return { error: "Cannot fulfill an order that has already been refunded." };
  }

  const now = new Date().toISOString();
  const wasAlreadyPaid = order.status === "paid" && order.payment_status === "captured";

  order.status = "paid";
  order.payment_status = "captured";
  order.razorpay_payment_id = params.razorpayPaymentId;
  order.updated_at = now;

  let payment = db.payments.find((p) => p.razorpay_order_id === params.razorpayOrderId);
  if (!payment) {
    payment = {
      id: `pay-${crypto.randomUUID()}`,
      order_id: order.id,
      user_id: order.user_id,
      provider: "razorpay",
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: params.razorpayPaymentId,
      amount_inr: order.total_inr,
      currency: "INR",
      status: "captured",
      signature_verified: Boolean(params.signatureVerified),
      webhook_confirmed: Boolean(params.webhookConfirmed),
      method: params.method || "card_or_upi",
      failure_reason: null,
      created_at: now,
      updated_at: now,
    };
    db.payments.unshift(payment);
  } else {
    payment.razorpay_payment_id = params.razorpayPaymentId;
    payment.status = "captured";
    if (params.signatureVerified) payment.signature_verified = true;
    if (params.webhookConfirmed) payment.webhook_confirmed = true;
    if (params.method) payment.method = params.method;
    payment.updated_at = now;
  }

  if (!wasAlreadyPaid) {
    if (order.promo_code) {
      const promo = db.promotions.find(
        (p) => p.code.toUpperCase() === order.promo_code!.toUpperCase()
      );
      if (promo) promo.usage_count += 1;
    }

    for (const item of order.items) {
      const book = db.books.find((b) => b.id === item.book_id);
      if (book) {
        book.sales_count += 1;
      }

      // Record Creator Earnings & ENOX Commission in Ledger
      const creator = db.creators.find((c) => c.slug === book?.creator_slug);
      const commRate = creator ? creator.commission_rate_percent : 30;
      const grossInr = item.unit_price_inr;
      const enoxComm = Math.round((grossInr * commRate) / 100);
      const creatorNet = Math.max(0, grossInr - enoxComm);

      db.earnings_ledger.unshift({
        id: `led-${crypto.randomUUID()}`,
        order_id: order.id,
        order_number: order.order_number,
        book_id: item.book_id,
        book_title: item.title_snapshot,
        creator_name: item.author_snapshot,
        creator_slug: book?.creator_slug || "enox-creator",
        gross_inr: grossInr,
        commission_rate_percent: commRate,
        enox_commission_inr: enoxComm,
        creator_net_inr: creatorNet,
        status: "pending_payout",
        created_at: now,
      });

      const existingLib = db.user_library.find(
        (l) => l.user_id === order.user_id && l.book_id === item.book_id
      );
      if (existingLib) {
        existingLib.status = "active";
        existingLib.order_id = order.id;
        existingLib.order_number = order.order_number;
        existingLib.revoked_at = null;
      } else {
        db.user_library.unshift({
          id: `lib-${crypto.randomUUID()}`,
          user_id: order.user_id,
          book_id: item.book_id,
          order_id: order.id,
          order_number: order.order_number,
          status: "active",
          download_count: 0,
          last_downloaded_at: null,
          granted_at: now,
          revoked_at: null,
        });
      }
    }
  }

  writeDb(db);
  return { order, alreadyFulfilled: wasAlreadyPaid };
}

export function markPaymentFailed(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  reason?: string;
}): Order | null {
  const db = readDb();
  const order = db.orders.find((o) => o.razorpay_order_id === params.razorpayOrderId);
  if (!order) return null;
  if (order.status === "paid") return order;

  const now = new Date().toISOString();
  order.status = "failed";
  order.payment_status = "failed";
  order.updated_at = now;

  const payment = db.payments.find((p) => p.razorpay_order_id === params.razorpayOrderId);
  if (payment) {
    payment.status = "failed";
    if (params.razorpayPaymentId) payment.razorpay_payment_id = params.razorpayPaymentId;
    payment.failure_reason = sanitizeText(params.reason || "Payment declined or cancelled", 300);
    payment.updated_at = now;
  }

  writeDb(db);
  return order;
}

export function refundOrderAndRevokeOwnership(params: {
  orderId?: string;
  razorpayOrderId?: string;
  reason?: string;
}): { order?: Order; revokedCount: number; error?: string } {
  const db = readDb();
  const order = db.orders.find(
    (o) =>
      (params.orderId && o.id === params.orderId) ||
      (params.razorpayOrderId && o.razorpay_order_id === params.razorpayOrderId)
  );
  if (!order) return { revokedCount: 0, error: "Order not found." };

  const now = new Date().toISOString();
  order.status = "refunded";
  order.payment_status = "refunded";
  order.updated_at = now;

  const payment = db.payments.find((p) => p.order_id === order.id);
  if (payment) {
    payment.status = "refunded";
    payment.failure_reason = sanitizeText(params.reason || "Order refunded", 300);
    payment.updated_at = now;
  }

  for (const led of db.earnings_ledger) {
    if (led.order_id === order.id) {
      led.status = "reversed";
    }
  }

  let revokedCount = 0;
  for (const lib of db.user_library) {
    if (lib.order_id === order.id && lib.status === "active") {
      lib.status = "revoked";
      lib.revoked_at = now;
      revokedCount += 1;
    }
  }

  writeDb(db);
  return { order, revokedCount };
}

export function checkAndRecordWebhookEvent(params: {
  eventId: string;
  eventType: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}): { isDuplicate: boolean; record: WebhookEventRecord } {
  const db = readDb();
  const existing = db.webhook_events.find((e) => e.event_id === params.eventId);
  if (existing) {
    return { isDuplicate: true, record: existing };
  }
  const record: WebhookEventRecord = {
    id: `wh-${crypto.randomUUID()}`,
    event_id: params.eventId,
    event_type: params.eventType,
    razorpay_order_id: params.razorpayOrderId || null,
    razorpay_payment_id: params.razorpayPaymentId || null,
    processed_at: new Date().toISOString(),
  };
  db.webhook_events.unshift(record);
  writeDb(db);
  return { isDuplicate: false, record };
}

// ============================================================================
// CUSTOMER LIBRARY, ORDERS, WISHLISTS, SUPPORT & SECURE DOWNLOADS
// ============================================================================

export function getUserOrders(userId: string): Order[] {
  const db = readDb();
  return db.orders.filter((o) => o.user_id === userId);
}

export function getUserOrderById(userId: string, orderId: string, isAdmin = false): Order | null {
  const db = readDb();
  const order = db.orders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) return null;
  if (!isAdmin && order.user_id !== userId) return null;
  return order;
}

export function getUserLibrary(userId: string): LibraryEntry[] {
  const db = readDb();
  return db.user_library
    .filter((l) => l.user_id === userId)
    .map((entry) => ({
      ...entry,
      book: db.books.find((b) => b.id === entry.book_id),
    }));
}

export function getUserSupportRequests(userId: string): SupportRequest[] {
  const db = readDb();
  return db.support_requests.filter((s) => s.user_id === userId);
}

export function createSupportRequest(params: {
  userId: string;
  subject: string;
  category: string;
  message: string;
}): { request?: SupportRequest; error?: string } {
  const db = readDb();
  const user = db.users.find((u) => u.id === params.userId);
  if (!user) return { error: "Authentication required." };
  const subject = sanitizeText(params.subject, 140);
  const message = sanitizeText(params.message, 2000);
  if (!subject || message.length < 10) {
    return { error: "Please provide a clear subject and details (at least 10 characters)." };
  }
  const req: SupportRequest = {
    id: `sup-${crypto.randomUUID()}`,
    user_id: user.id,
    user_email: user.email,
    subject,
    category: sanitizeText(params.category || "Order & Download Support", 60),
    message,
    status: "open",
    created_at: new Date().toISOString(),
  };
  db.support_requests.unshift(req);
  writeDb(db);
  return { request: req };
}

export function doesUserOwnBook(userId: string | null | undefined, bookId: string): boolean {
  if (!userId) return false;
  const db = readDb();
  const lib = db.user_library.find(
    (l) => l.user_id === userId && l.book_id === bookId && l.status === "active"
  );
  if (!lib) return false;
  const order = db.orders.find((o) => o.id === lib.order_id);
  return Boolean(order && order.status === "paid" && order.payment_status === "captured");
}

export function authorizeBookDownload(params: {
  userId: string;
  bookId: string;
  format: BookFormat;
  ipAddress: string;
  userAgent: string;
}): {
  authorized: boolean;
  statusCode: number;
  error?: string;
  orderId?: string;
  book?: Book;
} {
  const db = readDb();
  const user = db.users.find((u) => u.id === params.userId);
  const book = db.books.find((b) => b.id === params.bookId);

  if (!user) {
    return { authorized: false, statusCode: 401, error: "Authentication required." };
  }
  if (!book) {
    return { authorized: false, statusCode: 404, error: "Product not found." };
  }

  const libEntry = db.user_library.find(
    (l) => l.user_id === user.id && l.book_id === book.id
  );

  if (!libEntry) {
    db.download_audit_logs.unshift({
      id: `dl-${crypto.randomUUID()}`,
      user_id: user.id,
      user_email: user.email,
      book_id: book.id,
      book_title: book.title,
      order_id: "unowned",
      format: params.format,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      status: "denied",
      reason: "User does not own this product",
      created_at: new Date().toISOString(),
    });
    writeDb(db);
    return {
      authorized: false,
      statusCode: 403,
      error: "Access denied. You have not purchased this product.",
    };
  }

  const order = db.orders.find((o) => o.id === libEntry.order_id);
  if (
    libEntry.status !== "active" ||
    !order ||
    order.status !== "paid" ||
    order.payment_status !== "captured"
  ) {
    db.download_audit_logs.unshift({
      id: `dl-${crypto.randomUUID()}`,
      user_id: user.id,
      user_email: user.email,
      book_id: book.id,
      book_title: book.title,
      order_id: libEntry.order_id,
      format: params.format,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      status: "denied",
      reason: `Order status is ${order?.status || "unknown"} / library status is ${libEntry.status}`,
      created_at: new Date().toISOString(),
    });
    writeDb(db);
    return {
      authorized: false,
      statusCode: 403,
      error: "Download access has been revoked because the order was refunded or cancelled.",
    };
  }

  if (!book.formats.includes(params.format)) {
    return {
      authorized: false,
      statusCode: 400,
      error: `Format ${params.format} is not available for this publication.`,
    };
  }

  const now = new Date().toISOString();
  libEntry.download_count += 1;
  libEntry.last_downloaded_at = now;

  db.download_audit_logs.unshift({
    id: `dl-${crypto.randomUUID()}`,
    user_id: user.id,
    user_email: user.email,
    book_id: book.id,
    book_title: book.title,
    order_id: order.id,
    format: params.format,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    status: "granted",
    reason: "Verified owner & active paid order",
    created_at: now,
  });

  writeDb(db);
  return {
    authorized: true,
    statusCode: 200,
    orderId: order.id,
    book,
  };
}

export function readPrivateEbookFile(book: Book, format: BookFormat): {
  buffer: Buffer;
  filename: string;
  contentType: string;
} {
  ensurePrivateFilesExist([book]);
  if (format === "EPUB") {
    const rel = book.private_epub_path || `${book.slug}.epub`;
    const fullPath = path.join(PRIVATE_EBOOKS_DIR, path.basename(rel));
    const buffer = fs.existsSync(fullPath)
      ? fs.readFileSync(fullPath)
      : generateValidEpubBuffer(book);
    return {
      buffer,
      filename: `${book.slug}-enox-edition.epub`,
      contentType: "application/epub+zip",
    };
  }

  const rel = book.private_pdf_path || `${book.slug}.pdf`;
  const fullPath = path.join(PRIVATE_EBOOKS_DIR, path.basename(rel));
  const buffer = fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath)
    : generateValidPdfBuffer(book);
  return {
    buffer,
    filename: `${book.slug}-enox-edition.pdf`,
    contentType: "application/pdf",
  };
}

export function getUserWishlist(userId: string): WishlistItem[] {
  const db = readDb();
  return db.wishlists
    .filter((w) => w.user_id === userId)
    .map((w) => ({
      ...w,
      book: db.books.find((b) => b.id === w.book_id && b.status === "published"),
    }))
    .filter((w) => Boolean(w.book));
}

export function toggleUserWishlist(
  userId: string,
  bookId: string
): { inWishlist: boolean; count: number; error?: string } {
  const db = readDb();
  const book = db.books.find((b) => b.id === bookId && b.status === "published");
  if (!book) {
    return { inWishlist: false, count: 0, error: "Published product not found." };
  }
  const idx = db.wishlists.findIndex((w) => w.user_id === userId && w.book_id === bookId);
  let inWishlist = false;
  if (idx >= 0) {
    db.wishlists.splice(idx, 1);
    inWishlist = false;
  } else {
    db.wishlists.unshift({
      id: `wish-${crypto.randomUUID()}`,
      user_id: userId,
      book_id: bookId,
      created_at: new Date().toISOString(),
    });
    inWishlist = true;
  }
  writeDb(db);
  const count = db.wishlists.filter((w) => w.user_id === userId).length;
  return { inWishlist, count };
}

// ============================================================================
// VERIFIED PURCHASER REVIEWS & PRODUCT COPYRIGHT REPORTS
// ============================================================================

export function getPublishedReviewsForBook(bookId: string): Review[] {
  const db = readDb();
  return db.reviews
    .filter((r) => r.book_id === bookId && r.status === "published")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createVerifiedReview(params: {
  userId: string;
  bookId: string;
  rating: number;
  title: string;
  comment: string;
}): { review?: Review; error?: string; statusCode?: number } {
  const db = readDb();
  const user = db.users.find((u) => u.id === params.userId);
  if (!user) return { error: "Authentication required.", statusCode: 401 };

  const ownsBook = doesUserOwnBook(user.id, params.bookId);
  if (!ownsBook && user.role !== "admin") {
    return {
      error: "Only verified purchasers who own this product in their ENOX Library can submit a review.",
      statusCode: 403,
    };
  }

  const rating = Math.round(Number(params.rating));
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be an integer between 1 and 5.", statusCode: 400 };
  }

  const title = sanitizeText(params.title, 120);
  const comment = sanitizeText(params.comment, 1500);
  if (title.length < 3 || comment.length < 10) {
    return {
      error: "Please provide a review headline (min 3 chars) and review body (min 10 chars).",
      statusCode: 400,
    };
  }

  const duplicate = db.reviews.find(
    (r) => r.user_id === user.id && r.book_id === params.bookId
  );
  if (duplicate) {
    return {
      error: "You have already submitted a verified review for this product.",
      statusCode: 409,
    };
  }

  const now = new Date().toISOString();
  const review: Review = {
    id: `rev-${crypto.randomUUID()}`,
    book_id: params.bookId,
    user_id: user.id,
    reviewer_name: user.full_name,
    rating,
    title,
    comment,
    verified_purchase: true,
    status: "published",
    created_at: now,
    updated_at: now,
  };

  db.reviews.unshift(review);
  writeDb(db);
  return { review, statusCode: 201 };
}

export function createCopyrightReport(params: {
  bookId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  details: string;
}): { report?: CopyrightReport; error?: string } {
  const db = readDb();
  const book = db.books.find((b) => b.id === params.bookId);
  if (!book) return { error: "Reported product not found." };
  const reporterName = sanitizeText(params.reporterName, 100);
  const reporterEmail = params.reporterEmail.trim().toLowerCase();
  const reason = sanitizeText(params.reason, 120);
  const details = sanitizeText(params.details, 2000);
  if (!reporterName || !reporterEmail || !reason || details.length < 10) {
    return { error: "Please provide your name, email, reason, and report details." };
  }
  const report: CopyrightReport = {
    id: `rep-${crypto.randomUUID()}`,
    book_id: book.id,
    book_title: book.title,
    reporter_name: reporterName,
    reporter_email: reporterEmail,
    reason,
    details,
    status: "open",
    created_at: new Date().toISOString(),
  };
  db.copyright_reports.unshift(report);
  writeDb(db);
  return { report };
}

// ============================================================================
// CREATOR DASHBOARD & ADMIN CONSOLE
// ============================================================================

export function getAdminDashboardSnapshot() {
  const db = readDb();
  const paidOrders = db.orders.filter(
    (o) => o.status === "paid" && o.payment_status === "captured"
  );
  const totalRevenueInr = paidOrders.reduce((acc, o) => acc + o.total_inr, 0);
  const publishedBooksCount = db.books.filter((b) => b.status === "published").length;
  const pendingApprovalCount = db.books.filter((b) => b.status === "pending_review").length;
  const draftBooksCount = db.books.filter((b) => b.status === "draft").length;
  const archivedBooksCount = db.books.filter(
    (b) => b.status === "archived" || b.status === "unlisted" || b.status === "rejected"
  ).length;
  const totalCustomers = db.users.filter((u) => u.role === "customer").length;
  const totalDownloads = db.download_audit_logs.filter((d) => d.status === "granted").length;

  const totalPlatformCommissionInr = db.earnings_ledger
    .filter((l) => l.status !== "reversed")
    .reduce((s, l) => s + l.enox_commission_inr, 0);

  return {
    metrics: {
      totalRevenueInr,
      totalPlatformCommissionInr,
      paidOrdersCount: paidOrders.length,
      totalOrdersCount: db.orders.length,
      publishedBooksCount,
      pendingApprovalCount,
      draftBooksCount,
      archivedBooksCount,
      totalCustomers,
      totalCreators: db.creators.length,
      totalDownloads,
      activePromotionsCount: db.promotions.filter((p) => p.is_active).length,
      openCopyrightReportsCount: db.copyright_reports.filter((r) => r.status !== "resolved").length,
    },
    books: db.books,
    creators: getCreatorsWithProducts(),
    categories: getCategoriesWithCounts(),
    orders: db.orders,
    payments: db.payments,
    customers: db.users.map((u) => {
      const userOrders = paidOrders.filter((o) => o.user_id === u.id);
      const ownedCount = db.user_library.filter(
        (l) => l.user_id === u.id && l.status === "active"
      ).length;
      return {
        ...toPublicUserProfile(u),
        orders_count: userOrders.length,
        owned_books_count: ownedCount,
        total_spent_inr: userOrders.reduce((s, o) => s + o.total_inr, 0),
      };
    }),
    promotions: db.promotions,
    downloadLogs: db.download_audit_logs.slice(0, 50),
    reviews: db.reviews,
    legalPages: db.legal_pages,
    contactMessages: db.contact_messages,
    newsletterSubscribers: db.newsletter_subscribers,
    copyrightReports: db.copyright_reports,
    earningsLedger: db.earnings_ledger,
    payoutRecords: db.payout_records,
  };
}

export function upsertBookAdmin(
  input: Partial<Book> & {
    title: string;
    author: string;
    price_inr: number;
    category_id: string;
  }
): {
  book?: Book;
  error?: string;
} {
  const db = readDb();
  const category = db.categories.find(
    (c) => c.id === input.category_id || c.slug === input.category_id
  );
  if (!category) {
    return { error: "Selected category does not exist." };
  }

  const price = Number(input.price_inr);
  if (Number.isNaN(price) || price < 0) {
    return { error: "Price in INR must be a valid non-negative number." };
  }

  const slugBase =
    (input.slug || input.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `ebook-${Date.now()}`;

  const now = new Date().toISOString();
  const validStatuses: BookStatus[] = [
    "draft",
    "pending_review",
    "published",
    "rejected",
    "unlisted",
    "archived",
  ];

  if (input.id) {
    const existing = db.books.find((b) => b.id === input.id);
    if (!existing) return { error: "Product to update not found." };

    const slugConflict = db.books.find((b) => b.slug === slugBase && b.id !== existing.id);
    existing.title = sanitizeText(input.title, 180);
    existing.slug = slugConflict ? `${slugBase}-${existing.id.slice(-4)}` : slugBase;
    existing.subtitle = sanitizeText(input.subtitle ?? existing.subtitle, 240);
    existing.author = sanitizeText(input.author, 140);
    if (input.creator_slug) existing.creator_slug = sanitizeText(input.creator_slug, 80);
    existing.author_bio = sanitizeText(input.author_bio ?? existing.author_bio, 600);
    existing.short_description = sanitizeText(
      input.short_description ?? existing.short_description,
      400
    );
    existing.full_description = sanitizeText(
      input.full_description ?? existing.full_description,
      5000
    );
    existing.category_id = category.id;
    existing.category_name = category.name;
    existing.category_slug = category.slug;
    existing.cover_image =
      input.cover_image || existing.cover_image || "/covers/refractive-systems.svg";
    existing.price_inr = price;
    existing.original_price_inr =
      input.original_price_inr !== undefined &&
      input.original_price_inr !== null &&
      Number(input.original_price_inr) >= price
        ? Number(input.original_price_inr)
        : null;
    existing.publication_date = input.publication_date || existing.publication_date;
    existing.language = sanitizeText(input.language || existing.language || "English", 40);
    existing.formats =
      Array.isArray(input.formats) && input.formats.length > 0
        ? input.formats
        : existing.formats;
    existing.pages = Math.max(1, Number(input.pages || existing.pages || 200));
    existing.isbn = sanitizeText(input.isbn ?? existing.isbn, 40);
    existing.file_size_label = sanitizeText(
      input.file_size_label || existing.file_size_label || "10.2 MB",
      30
    );
    if (input.status && validStatuses.includes(input.status)) {
      existing.status = input.status;
    }
    if (typeof input.is_featured === "boolean") existing.is_featured = input.is_featured;
    if (typeof input.is_bestseller === "boolean") existing.is_bestseller = input.is_bestseller;
    if (typeof input.is_demo === "boolean") existing.is_demo = input.is_demo;
    if (Array.isArray(input.highlights)) {
      existing.highlights = input.highlights.map((h) => sanitizeText(h, 200)).filter(Boolean);
    }
    if (Array.isArray(input.sample_pages)) {
      existing.sample_pages = input.sample_pages;
    }
    existing.updated_at = now;
    ensurePrivateFilesExist([existing]);
    writeDb(db);
    return { book: existing };
  }

  const slugConflict = db.books.some((b) => b.slug === slugBase);
  const finalSlug = slugConflict
    ? `${slugBase}-${Math.floor(100 + Math.random() * 900)}`
    : slugBase;
  const newBook: Book = {
    id: `book-${crypto.randomUUID()}`,
    title: sanitizeText(input.title, 180),
    slug: finalSlug,
    subtitle: sanitizeText(input.subtitle || "", 240),
    author: sanitizeText(input.author, 140),
    creator_slug: sanitizeText(input.creator_slug || "aarav-mehta", 80),
    author_bio: sanitizeText(input.author_bio || "", 600),
    short_description: sanitizeText(
      input.short_description ||
        input.full_description?.slice(0, 200) ||
        "Digital product on ENOX Ebooks.",
      400
    ),
    full_description: sanitizeText(
      input.full_description || input.short_description || "Digital product on ENOX Ebooks.",
      5000
    ),
    category_id: category.id,
    category_name: category.name,
    category_slug: category.slug,
    cover_image: input.cover_image || "/covers/refractive-systems.svg",
    price_inr: price,
    original_price_inr:
      input.original_price_inr && Number(input.original_price_inr) >= price
        ? Number(input.original_price_inr)
        : null,
    currency: "INR",
    publication_date: input.publication_date || now.slice(0, 10),
    language: sanitizeText(input.language || "English", 40),
    formats:
      Array.isArray(input.formats) && input.formats.length > 0 ? input.formats : ["PDF", "EPUB"],
    pages: Math.max(1, Number(input.pages || 180)),
    isbn: sanitizeText(input.isbn || `978-81-974021-${Math.floor(10 + Math.random() * 89)}`, 40),
    file_size_label: sanitizeText(input.file_size_label || "9.8 MB", 30),
    private_pdf_path: `${finalSlug}.pdf`,
    private_epub_path: `${finalSlug}.epub`,
    sample_pages:
      Array.isArray(input.sample_pages) && input.sample_pages.length > 0
        ? input.sample_pages
        : [
            {
              chapter_number: 1,
              chapter_title: "Overview",
              content: sanitizeText(
                input.short_description || "Sample excerpt from this ENOX publication.",
                1500
              ),
            },
          ],
    highlights:
      Array.isArray(input.highlights) && input.highlights.length > 0
        ? input.highlights.map((h) => sanitizeText(h, 200)).filter(Boolean)
        : [
            "Instant verified digital delivery in PDF & EPUB formats",
            "Formatted for high-contrast reading across desktop, tablet, and mobile",
          ],
    status:
      input.status && validStatuses.includes(input.status) ? input.status : "pending_review",
    is_featured: Boolean(input.is_featured),
    is_bestseller: Boolean(input.is_bestseller),
    is_demo: input.is_demo !== undefined ? Boolean(input.is_demo) : false,
    rating_avg: 0,
    review_count: 0,
    sales_count: 0,
    created_at: now,
    updated_at: now,
  };

  db.books.unshift(newBook);
  ensurePrivateFilesExist([newBook]);
  writeDb(db);
  return { book: newBook };
}

export function deleteOrArchiveBookAdmin(bookId: string): {
  action: "deleted" | "archived";
  book?: Book;
  error?: string;
} {
  const db = readDb();
  const idx = db.books.findIndex((b) => b.id === bookId);
  if (idx < 0) return { action: "archived", error: "Product not found." };
  const book = db.books[idx];

  const hasOrders = db.orders.some((o) => o.items.some((i) => i.book_id === bookId));
  const hasLibraryOwners = db.user_library.some((l) => l.book_id === bookId);

  if (hasOrders || hasLibraryOwners) {
    book.status = "archived";
    book.is_featured = false;
    book.updated_at = new Date().toISOString();
    writeDb(db);
    return { action: "archived", book };
  }

  db.books.splice(idx, 1);
  writeDb(db);
  return { action: "deleted" };
}

export function savePrivateUploadedEbookFile(params: {
  bookId: string;
  format: BookFormat;
  buffer: Buffer;
  fileSizeLabel: string;
}): { book?: Book; error?: string } {
  const db = readDb();
  const book = db.books.find((b) => b.id === params.bookId);
  if (!book) return { error: "Product not found." };
  if (!fs.existsSync(PRIVATE_EBOOKS_DIR)) {
    fs.mkdirSync(PRIVATE_EBOOKS_DIR, { recursive: true });
  }
  const ext = params.format === "EPUB" ? "epub" : "pdf";
  const safeFilename = `${book.slug}.${ext}`;
  const fullPath = path.join(PRIVATE_EBOOKS_DIR, safeFilename);
  fs.writeFileSync(fullPath, params.buffer);

  if (params.format === "EPUB") {
    book.private_epub_path = safeFilename;
    if (!book.formats.includes("EPUB")) book.formats.push("EPUB");
  } else {
    book.private_pdf_path = safeFilename;
    if (!book.formats.includes("PDF")) book.formats.push("PDF");
  }
  book.file_size_label = params.fileSizeLabel;
  book.updated_at = new Date().toISOString();
  writeDb(db);
  return { book };
}

export function upsertCategoryAdmin(input: {
  id?: string;
  name: string;
  description?: string;
  icon_name?: string;
  sort_order?: number;
}): { category?: Category; error?: string } {
  const db = readDb();
  const name = sanitizeText(input.name, 80);
  if (!name) return { error: "Category name is required." };
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (input.id) {
    const existing = db.categories.find((c) => c.id === input.id);
    if (!existing) return { error: "Category not found." };
    existing.name = name;
    existing.slug = slug;
    existing.description = sanitizeText(input.description ?? existing.description, 300);
    existing.icon_name = sanitizeText(input.icon_name || existing.icon_name || "BookOpen", 40);
    if (typeof input.sort_order === "number") existing.sort_order = input.sort_order;
    for (const b of db.books) {
      if (b.category_id === existing.id) {
        b.category_name = existing.name;
        b.category_slug = existing.slug;
      }
    }
    writeDb(db);
    return { category: existing };
  }

  const newCat: Category = {
    id: `cat-${crypto.randomUUID()}`,
    name,
    slug,
    description: sanitizeText(input.description || "", 300),
    icon_name: sanitizeText(input.icon_name || "BookOpen", 40),
    sort_order: typeof input.sort_order === "number" ? input.sort_order : db.categories.length + 1,
  };
  db.categories.push(newCat);
  writeDb(db);
  return { category: newCat };
}

export function upsertPromotionAdmin(input: {
  id?: string;
  code: string;
  title: string;
  description?: string;
  discount_type: "percentage" | "fixed_inr";
  discount_value: number;
  min_order_inr?: number;
  max_discount_inr?: number | null;
  is_active?: boolean;
}): { promotion?: Promotion; error?: string } {
  const db = readDb();
  const code = sanitizeText(input.code, 30).toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Promo code is required." };
  const val = Number(input.discount_value);
  if (Number.isNaN(val) || val <= 0) return { error: "Discount value must be positive." };

  if (input.id) {
    const existing = db.promotions.find((p) => p.id === input.id);
    if (!existing) return { error: "Promotion not found." };
    existing.code = code;
    existing.title = sanitizeText(input.title, 120);
    existing.description = sanitizeText(input.description ?? existing.description, 300);
    existing.discount_type = input.discount_type;
    existing.discount_value = val;
    existing.min_order_inr = Number(input.min_order_inr ?? existing.min_order_inr ?? 0);
    existing.max_discount_inr =
      input.max_discount_inr !== undefined
        ? input.max_discount_inr
          ? Number(input.max_discount_inr)
          : null
        : existing.max_discount_inr;
    if (typeof input.is_active === "boolean") existing.is_active = input.is_active;
    writeDb(db);
    return { promotion: existing };
  }

  const promo: Promotion = {
    id: `promo-${crypto.randomUUID()}`,
    code,
    title: sanitizeText(input.title || `${code} Offer`, 120),
    description: sanitizeText(input.description || "", 300),
    discount_type: input.discount_type,
    discount_value: val,
    min_order_inr: Number(input.min_order_inr || 0),
    max_discount_inr: input.max_discount_inr ? Number(input.max_discount_inr) : null,
    is_active: input.is_active !== undefined ? input.is_active : true,
    starts_at: new Date().toISOString(),
    expires_at: "2027-12-31T23:59:59.000Z",
    usage_count: 0,
  };
  db.promotions.unshift(promo);
  writeDb(db);
  return { promotion: promo };
}

export function updateCopyrightReportStatusAdmin(
  reportId: string,
  status: "open" | "investigating" | "resolved"
): CopyrightReport | null {
  const db = readDb();
  const rep = db.copyright_reports.find((r) => r.id === reportId);
  if (!rep) return null;
  rep.status = status;
  writeDb(db);
  return rep;
}

// ============================================================================
// LEGAL PAGES, NEWSLETTER & CONTACT
// ============================================================================

export function getLegalPageBySlug(slug: string): LegalPage | null {
  const db = readDb();
  return db.legal_pages.find((p) => p.slug === slug) || null;
}

export function getAllLegalPages(): LegalPage[] {
  const db = readDb();
  return db.legal_pages;
}

export function updateLegalPageAdmin(params: {
  slug: string;
  title: string;
  subtitle: string;
  content_markdown: string;
}): LegalPage | null {
  const db = readDb();
  const page = db.legal_pages.find((p) => p.slug === params.slug);
  if (!page) return null;
  page.title = sanitizeText(params.title, 140);
  page.subtitle = sanitizeText(params.subtitle, 260);
  page.content_markdown = params.content_markdown.slice(0, 25000);
  page.last_updated = new Date().toISOString().slice(0, 10);
  page.updated_at = new Date().toISOString();
  writeDb(db);
  return page;
}

export function subscribeToNewsletter(params: {
  email: string;
  consentGiven: boolean;
}): { ok: boolean; error?: string } {
  const email = params.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }
  if (!params.consentGiven) {
    return {
      ok: false,
      error: "Please check the consent box to receive editorial dispatches from ENOX.",
    };
  }
  const db = readDb();
  const existing = db.newsletter_subscribers.find((s) => s.email === email);
  if (existing) {
    existing.status = "subscribed";
    existing.consent_given = true;
    existing.consent_timestamp = new Date().toISOString();
  } else {
    db.newsletter_subscribers.unshift({
      id: `sub-${crypto.randomUUID()}`,
      email,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
      status: "subscribed",
    });
  }
  writeDb(db);
  return { ok: true };
}

export function submitContactMessage(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { ok: boolean; error?: string } {
  const name = sanitizeText(params.name, 100);
  const email = params.email.trim().toLowerCase();
  const subject = sanitizeText(params.subject, 160);
  const message = sanitizeText(params.message, 3000);

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject || message.length < 10) {
    return {
      ok: false,
      error: "Please fill in your name, a valid email, subject, and message (at least 10 characters).",
    };
  }

  const db = readDb();
  db.contact_messages.unshift({
    id: `msg-${crypto.randomUUID()}`,
    name,
    email,
    subject,
    message,
    status: "new",
    created_at: new Date().toISOString(),
  });
  writeDb(db);
  return { ok: true };
}
