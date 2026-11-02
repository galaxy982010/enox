import React from "react";
import Link from "next/link";

export interface EnoxLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark-bg";
  className?: string;
  priority?: boolean;
  showTagline?: boolean;
}

/**
  * Official ENOX Ebooks Brand Logo Component.
  * Uses the exact user-provided artwork stored in /assets/brand/enox-logo.png
  * (aspect ratio 662:402) with zero stretching, cropping, or text replacement.
  */
export function EnoxLogo({
  size = "md",
  variant = "default",
  className = "",
  showTagline = false,
}: EnoxLogoProps) {
  const dimensions =
    size === "sm"
      ? { width: 96, height: 58, className: "h-9 w-auto" }
      : size === "lg"
        ? { width: 152, height: 92, className: "h-14 w-auto" }
        : size === "xl"
          ? { width: 198, height: 120, className: "h-20 w-auto" }
          : { width: 122, height: 74, className: "h-11 w-auto" };

  const src =
    variant === "dark-bg"
      ? "/assets/brand/enox-logo-dark-bg.png"
      : "/assets/brand/enox-logo.png";

  return (
    <Link
      href="/"
      aria-label="ENOX Ebooks Home"
      className={`inline-flex flex-col items-start select-none ${className}`}
    >
      <img
        src={src}
        alt="ENOX ebooks"
        width={dimensions.width}
        height={dimensions.height}
        className={`${dimensions.className} object-contain block`}
      />
      {showTagline && (
        <span className="mt-1.5 text-[11px] font-medium tracking-wide text-[#77736D]">
          Discover Ideas Worth Investing In.
        </span>
      )}
    </Link>
  );
}
