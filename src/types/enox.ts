export type UserRole = "customer" | "creator" | "admin";
export type CreatorPlanTier = "free" | "premium";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  bio: string;
  role: UserRole;
  creator_slug?: string;
  creator_plan?: CreatorPlanTier;
  newsletter_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  handle?: string;
  specialty?: string;
  tagline?: string;
  short_bio?: string;
  bio?: string;
  avatar_initials?: string;
  initials?: string;
  avatar_bg?: string;
  location?: string;
  website?: string;
  plan?: CreatorPlanTier;
  plan_tier?: CreatorPlanTier;
  commission_rate_percent: 30 | 20 | number;
  max_active_listings: 5 | 25 | number;
  joined_at?: string;
  joined_date?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  sort_order: number;
  book_count?: number;
}

export type BookFormat = "PDF" | "EPUB";
export type BookStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "unlisted"
  | "archived";

export interface SamplePage {
  chapter_number: number;
  chapter_title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  author: string;
  creator_slug?: string;
  author_bio: string;
  short_description: string;
  full_description: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  cover_image: string;
  price_inr: number;
  original_price_inr: number | null;
  currency: "INR";
  publication_date: string;
  language: string;
  formats: BookFormat[];
  pages: number;
  isbn: string;
  file_size_label: string;
  private_pdf_path: string | null;
  private_epub_path: string | null;
  sample_pages: SamplePage[];
  highlights: string[];
  status: BookStatus;
  is_featured: boolean;
  is_bestseller: boolean;
  is_demo: boolean;
  rating_avg: number;
  review_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: "percentage" | "fixed_inr";
  discount_value: number;
  min_order_inr: number;
  max_discount_inr: number | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  usage_count: number;
}

export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: string;
  book_slug: string;
  title_snapshot: string;
  author_snapshot: string;
  cover_snapshot: string;
  unit_price_inr: number;
  quantity: 1;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  subtotal_inr: number;
  discount_inr: number;
  total_inr: number;
  currency: "INR";
  promo_code: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  user_id: string;
  provider: "razorpay";
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_inr: number;
  currency: "INR";
  status: "created" | "verified" | "captured" | "failed" | "refunded";
  signature_verified: boolean;
  webhook_confirmed: boolean;
  method: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRecord {
  id: string;
  event_id: string;
  event_type: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  processed_at: string;
}

export interface LibraryEntry {
  id: string;
  user_id: string;
  book_id: string;
  order_id: string;
  order_number: string;
  status: "active" | "revoked";
  download_count: number;
  last_downloaded_at: string | null;
  granted_at: string;
  revoked_at: string | null;
  book?: Book;
}

export interface DownloadAuditLog {
  id: string;
  user_id: string;
  user_email: string;
  book_id: string;
  book_title: string;
  order_id: string;
  format: BookFormat;
  ip_address: string;
  user_agent: string;
  status: "granted" | "denied";
  reason: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  book?: Book;
}

export interface Review {
  id: string;
  book_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface LegalPage {
  slug: string;
  title: string;
  subtitle: string;
  last_updated: string;
  content_markdown: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "resolved";
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  consent_given: boolean;
  consent_timestamp: string;
  status: "subscribed" | "unsubscribed";
}

export interface CopyrightReport {
  id: string;
  book_id: string;
  book_title: string;
  reporter_name: string;
  reporter_email: string;
  reason: string;
  details: string;
  status: "open" | "investigating" | "resolved";
  created_at: string;
}

export interface SupportRequest {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "answered";
  created_at: string;
}

export interface EarningsLedgerEntry {
  id: string;
  order_id: string;
  order_number: string;
  book_id: string;
  book_title: string;
  creator_name: string;
  creator_slug: string;
  gross_inr: number;
  commission_rate_percent: number;
  enox_commission_inr: number;
  creator_net_inr: number;
  status: "settled" | "pending_payout" | "reversed";
  created_at: string;
}

export interface CreatorPayoutRecord {
  id: string;
  creator_name: string;
  creator_slug: string;
  amount_inr: number;
  period_label: string;
  payout_method?: string;
  status: "scheduled" | "processed";
  created_at: string;
}
