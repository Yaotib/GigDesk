import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

// Geist has no ₵ glyph. Inter's latin-ext subset (which contains U+20B5) is the per-glyph fallback;
// the browser downloads it only when such a character appears.
const inter = Inter({ subsets: ["latin-ext"], variable: "--font-inter", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "GigDesk", template: "%s · GigDesk" },
  description: "From WhatsApp enquiry to approved quote and stage rider.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171a19",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GH" className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
