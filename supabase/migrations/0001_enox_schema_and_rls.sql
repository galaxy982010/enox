-- ============================================================================
-- ENOX — Premium Ebook Marketplace
-- Migration: 0001_enox_schema_and_rls.sql
-- Description: Relational schema, foreign keys, indexes, RLS policies,
--              admin authorization functions, and storage bucket policies.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & STRICT ADMIN ROLES
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  bio text not null default '',
  avatar_url text,
  newsletter_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Separate roles table so customers can NEVER escalate privileges via profile update
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'admin')) default 'customer',
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Security definer helper to check admin status safely inside RLS policies
create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = coalesce(check_user_id, auth.uid())
      and role = 'admin'
  );
$$;

-- Trigger to auto-create profile and default customer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'Reader'), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  icon_name text not null default 'BookOpen',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. BOOKS (CATALOG)
-- ----------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text not null default '',
  author text not null,
  author_bio text not null default '',
  short_description text not null,
  full_description text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  cover_image text not null,
  price_inr numeric(10, 2) not null check (price_inr >= 0),
  original_price_inr numeric(10, 2) check (original_price_inr is null or original_price_inr >= price_inr),
  currency text not null default 'INR' check (currency = 'INR'),
  publication_date date not null default current_date,
  language text not null default 'English',
  formats text[] not null default array['PDF', 'EPUB'],
  pages integer not null default 200 check (pages > 0),
  isbn text not null default '',
  file_size_label text not null default '8.4 MB',
  private_pdf_path text,
  private_epub_path text,
  sample_pages jsonb not null default '[]'::jsonb,
  highlights text[] not null default array[]::text[],
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_demo boolean not null default false,
  rating_avg numeric(3, 2) not null default 0.00 check (rating_avg >= 0 and rating_avg <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  sales_count integer not null default 0 check (sales_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_status on public.books(status);
create index if not exists idx_books_category on public.books(category_id);
create index if not exists idx_books_slug on public.books(slug);
create index if not exists idx_books_featured on public.books(is_featured) where status = 'published';
create index if not exists idx_books_bestseller on public.books(is_bestseller) where status = 'published';

-- ----------------------------------------------------------------------------
-- 4. PROMOTIONS / DISCOUNT CODES
-- ----------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  discount_type text not null check (discount_type in ('percentage', 'fixed_inr')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_inr numeric(10, 2) not null default 0 check (min_order_inr >= 0),
  max_discount_inr numeric(10, 2),
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. ORDERS & ORDER ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_email text not null,
  customer_name text not null,
  subtotal_inr numeric(10, 2) not null check (subtotal_inr >= 0),
  discount_inr numeric(10, 2) not null default 0 check (discount_inr >= 0),
  total_inr numeric(10, 2) not null check (total_inr >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  promo_code text,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')) default 'pending',
  payment_status text not null check (payment_status in ('pending', 'authorized', 'captured', 'failed', 'refunded')) default 'pending',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  title_snapshot text not null,
  author_snapshot text not null,
  cover_snapshot text not null,
  unit_price_inr numeric(10, 2) not null check (unit_price_inr >= 0),
  quantity integer not null default 1 check (quantity = 1),
  unique (order_id, book_id)
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- 6. PAYMENTS & IDEMPOTENT WEBHOOK AUDIT LOGS
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'razorpay',
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  amount_inr numeric(10, 2) not null check (amount_inr >= 0),
  currency text not null default 'INR',
  status text not null check (status in ('created', 'verified', 'captured', 'failed', 'refunded')),
  signature_verified boolean not null default false,
  webhook_confirmed boolean not null default false,
  method text,
  failure_reason text,
  raw_audit jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order_id on public.payments(order_id);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  processed_at timestamptz not null default now(),
  payload_summary jsonb not null default '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 7. USER LIBRARY (PURCHASED EBOOK OWNERSHIP) & DOWNLOAD AUDIT LOGS
-- ----------------------------------------------------------------------------
create table if not exists public.user_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  status text not null check (status in ('active', 'revoked')) default 'active',
  download_count integer not null default 0 check (download_count >= 0),
  last_downloaded_at timestamptz,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, book_id)
);

create index if not exists idx_user_library_user_id on public.user_library(user_id);

create table if not exists public.download_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  format text not null check (format in ('PDF', 'EPUB')),
  ip_address text,
  user_agent text,
  status text not null check (status in ('granted', 'denied')),
  reason text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. WISHLISTS & VERIFIED REVIEWS
-- ----------------------------------------------------------------------------
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists idx_wishlists_user_id on public.wishlists(user_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text not null,
  comment text not null,
  verified_purchase boolean not null default true,
  status text not null check (status in ('published', 'hidden')) default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists idx_reviews_book_id on public.reviews(book_id);

-- Trigger to recalculate book aggregate ratings from real published reviews
create or replace function public.refresh_book_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_book uuid;
begin
  target_book := coalesce(new.book_id, old.book_id);
  update public.books
  set
    rating_avg = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.reviews
      where book_id = target_book and status = 'published'
    ), 0),
    review_count = (
      select count(*)
      from public.reviews
      where book_id = target_book and status = 'published'
    ),
    updated_at = now()
  where id = target_book;
  return null;
end;
$$;

drop trigger if exists trg_refresh_book_rating on public.reviews;
create trigger trg_refresh_book_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_book_rating();

-- ----------------------------------------------------------------------------
-- 9. NEWSLETTER SUBSCRIBERS, CONTACT MESSAGES & EDITABLE LEGAL PAGES
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_given boolean not null check (consent_given = true),
  consent_timestamp timestamptz not null default now(),
  status text not null check (status in ('subscribed', 'unsubscribed')) default 'subscribed'
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null check (status in ('new', 'resolved')) default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.legal_pages (
  slug text primary key,
  title text not null,
  subtitle text not null default '',
  last_updated date not null default current_date,
  content_markdown text not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.user_library enable row level security;
alter table public.download_audit_logs enable row level security;
alter table public.wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.legal_pages enable row level security;

-- Profiles: users read/update their own profile; admins read all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- User Roles: users can read their own role; ONLY admins can modify roles
create policy "Users can view own role" on public.user_roles
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Only admins manage roles" on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- Categories: public read; admin write
create policy "Public can read categories" on public.categories
  for select using (true);

create policy "Admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Books: public can ONLY read published books; admins can read/write all
create policy "Public can read published books" on public.books
  for select using (status = 'published' or public.is_admin());

create policy "Admins manage books" on public.books
  for all using (public.is_admin()) with check (public.is_admin());

-- Promotions: public can read active promotions; admins manage all
create policy "Public can view active promotions" on public.promotions
  for select using (is_active = true or public.is_admin());

create policy "Admins manage promotions" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- Orders & Order Items: customers can only read their own orders; writes happen via server/admin
create policy "Customers read own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Customers read own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Payments & Webhooks: customers read own payment records; never client-writable
create policy "Customers read own payments" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins read webhook events" on public.payment_webhook_events
  for select using (public.is_admin());

-- User Library: customers can ONLY read their own active library entries; never client-writable
create policy "Customers read own library" on public.user_library
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Customers read own download logs" on public.download_audit_logs
  for select using (auth.uid() = user_id or public.is_admin());

-- Wishlists: authenticated users manage their own wishlist
create policy "Users manage own wishlist" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reviews: public reads published reviews; only verified purchasers can insert own review
create policy "Public reads published reviews" on public.reviews
  for select using (status = 'published' or public.is_admin());

create policy "Verified owners can create review" on public.reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.user_library ul
      where ul.user_id = auth.uid()
        and ul.book_id = reviews.book_id
        and ul.status = 'active'
    )
  );

create policy "Admins manage reviews" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Legal Pages: public read; admin write
create policy "Public reads legal pages" on public.legal_pages
  for select using (true);

create policy "Admins manage legal pages" on public.legal_pages
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. SUPABASE STORAGE BUCKETS & POLICIES
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

-- Covers bucket: publicly readable, only admins can upload/modify
create policy "Public read access for book covers" on storage.objects
  for select using (bucket_id = 'covers');

create policy "Admins manage book covers" on storage.objects
  for all using (bucket_id = 'covers' and public.is_admin())
  with check (bucket_id = 'covers' and public.is_admin());

-- Ebooks bucket: STRICTLY PRIVATE. Only admins can upload/delete; downloads use server signed URLs
create policy "Admins manage private ebooks" on storage.objects
  for all using (bucket_id = 'ebooks' and public.is_admin())
  with check (bucket_id = 'ebooks' and public.is_admin());
