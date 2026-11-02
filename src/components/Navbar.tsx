"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Library,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { EnoxLogo } from "./EnoxLogo";
import { useStore } from "@/context/StoreContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, cartBookIds, wishlistBookIds, libraryBookIds, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    if (q) {
      router.push(`/books?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/books");
    }
  };

  const navLinks = [
    { href: "/books", label: "Discover" },
    { href: "/books?category=ebooks-guides", label: "Ebooks" },
    { href: "/books?category=templates", label: "Templates" },
    { href: "/books?category=study-resources", label: "Other Products" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E1D6] bg-[#F7F3EB]/78 backdrop-blur-2xl shadow-[0_4px_24px_-6px_rgba(41,41,41,0.06)] transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Official ENOX Logo + Desktop Primary Links */}
        <div className="flex items-center gap-7">
          <EnoxLogo size="md" priority />

          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-[10px] px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#292929] text-white shadow-xs"
                      : "text-[#292929] hover:bg-white/80 hover:text-[#7C8665]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Liquid Glass Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xs xl:max-w-sm items-center relative group"
          role="search"
        >
          <Search className="h-4 w-4 text-[#77736D] group-focus-within:text-[#7C8665] absolute left-3.5 pointer-events-none transition-colors" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ebooks, templates, guides..."
            aria-label="Search digital products"
            className="w-full rounded-[12px] border border-[#E8E1D6] bg-white/75 backdrop-blur-xl pl-10 pr-4 py-2 text-sm text-[#292929] placeholder:text-[#77736D] focus:border-[#7C8665] focus:bg-white focus:outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
          />
        </form>

        {/* Right: Become a Creator, Wishlist, Cart & Sign In / Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-white/80 text-[#292929] hover:bg-white transition-colors"
            aria-label="Toggle Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href="/creator"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-[10px] border border-[#B89455]/45 bg-gradient-to-r from-white/90 via-[#F7F3EB]/90 to-[#B89455]/15 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#292929] hover:border-[#B89455] hover:-translate-y-0.5 transition-all shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#B89455]" />
            <span>Become a Creator</span>
          </Link>

          {user && (
            <Link
              href="/account?tab=library"
              className="hidden xl:inline-flex items-center gap-1.5 rounded-[10px] border border-[#7C8665]/35 bg-[#7C8665]/10 px-3 py-2 text-xs font-semibold text-[#292929] hover:bg-[#7C8665]/20 transition-colors"
              title="My Download Library"
            >
              <Library className="h-3.5 w-3.5 text-[#7C8665]" />
              <span>Library</span>
              {libraryBookIds.length > 0 && (
                <span className="rounded-md bg-[#7C8665] px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {libraryBookIds.length}
                </span>
              )}
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[10px] border border-[#B89455]/45 bg-[#B89455]/15 px-3 py-2 text-xs font-semibold text-[#292929] hover:bg-[#B89455] hover:text-white transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#B89455] group-hover:text-white" />
              <span>Admin</span>
            </Link>
          )}

          <Link
            href="/account?tab=wishlist"
            aria-label="Saved Wishlist"
            className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-white/80 text-[#292929] hover:border-[#B89455] hover:bg-white transition-all"
          >
            <Heart className="h-4 w-4" />
            {wishlistBookIds.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B89455] px-1 text-[10px] font-bold text-white">
                {wishlistBookIds.length}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className="relative inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#E8E1D6] bg-white/85 px-3 text-sm font-medium text-[#292929] hover:border-[#7C8665] hover:bg-white transition-all"
          >
            <ShoppingBag className="h-4 w-4 text-[#7C8665]" />
            {cartBookIds.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7C8665] px-1.5 text-[11px] font-semibold text-white">
                {cartBookIds.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/account"
                className="btn-primary-glass inline-flex h-10 items-center gap-2 px-3.5 text-xs font-semibold"
              >
                <User className="h-3.5 w-3.5 text-[#B89455]" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {user.full_name.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                aria-label="Sign Out"
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-white/80 text-[#77736D] hover:text-[#C84444] hover:bg-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary-glass inline-flex h-10 items-center gap-1.5 px-4 text-xs font-semibold"
            >
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-white/85 text-[#292929]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Compact Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t border-[#E8E1D6] bg-[#F7F3EB]/95 px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="h-4 w-4 text-[#77736D] absolute left-3.5" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ebooks, templates, guides..."
              autoFocus
              className="w-full rounded-[10px] border border-[#E8E1D6] bg-white pl-10 pr-20 py-2.5 text-sm text-[#292929] placeholder:text-[#77736D] focus:border-[#7C8665] focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 rounded-[8px] bg-[#292929] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E8E1D6] bg-[#F7F3EB]/98 backdrop-blur-xl px-4 pt-3 pb-6 lg:hidden">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#292929] hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/creator"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-[10px] px-3 py-2.5 text-sm font-semibold text-[#292929] hover:bg-white flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-[#B89455]" />
              <span>Become a Creator</span>
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#292929] hover:bg-white"
            >
              Creator Plans
            </Link>
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#292929] hover:bg-white"
            >
              My Account &amp; Downloads
            </Link>
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] px-3 py-2.5 text-sm font-semibold text-[#7C8665] hover:bg-white"
              >
                Admin Console
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-left rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#C84444] hover:bg-white"
              >
                Sign Out ({user.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
