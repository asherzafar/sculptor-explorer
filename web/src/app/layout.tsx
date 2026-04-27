import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { MobileGate } from "@/components/MobileGate";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative URLs (og:image, twitter:image) against the production
  // domain at build time. Without this, Next falls back to localhost which
  // breaks Open Graph rendering on social platforms. Update when a custom
  // domain is wired up.
  metadataBase: new URL("https://sculptor-explorer.vercel.app"),
  title: "Sculpture in Data",
  description:
    "How sculpture evolved — materials, movements, geography, and lineages since 1800. " +
    "3,630 sculptors, cross-referenced between Wikidata and Getty ULAN.",
  openGraph: {
    title: "Sculpture in Data",
    description:
      "Explore how sculpture evolved across 200 years — 3,630 sculptors, " +
      "their movements, geographies, and mentor-student lineages.",
    type: "website",
    // Note: og:image is wired automatically by Next from app/opengraph-image.tsx;
    // we don't need to declare it here. Same for og:image:width/height/alt.
  },
  twitter: {
    card: "summary_large_image",
    title: "Sculpture in Data",
    description:
      "How sculpture evolved across 200 years — 3,630 sculptors and their lineages.",
    // twitter:image is also auto-wired from app/opengraph-image.tsx (Next reuses it
    // when no explicit twitter-image is provided), but the card type still needs
    // to be set for X to use the large card layout.
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="h-full bg-bg-primary text-text-primary font-body">
        <MobileGate />
        <div className="hidden md:flex h-full">
          <Nav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
