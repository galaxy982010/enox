import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ENOX Ebooks — Read. Learn. Grow. | Premium Digital Bookstore",
    template: "%s | ENOX Ebooks",
  },
  description:
    "Discover foundational digital monographs and technical ebooks on ENOX Ebooks. Instant DRM-free PDF & EPUB delivery, verified reader reviews, and secure INR checkout.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ENOX Ebooks — Read. Learn. Grow.",
    description:
      "Curated digital monographs across systems architecture, design systems, applied AI, and cognitive strategy.",
    type: "website",
    locale: "en_IN",
    siteName: "ENOX Ebooks",
    images: ["/assets/brand/enox-logo-original.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <StoreProvider>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
