import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { MobileNav } from "@/components/MobileNav";
import { dataSnapshot } from "@/lib/snapshot";

export const metadata: Metadata = {
  // Resolves relative URLs (og:image, twitter:image) against the production
  // domain at build time. Without this, Next falls back to localhost which
  // breaks Open Graph rendering on social platforms. Update when a custom
  // domain is wired up.
  metadataBase: new URL("https://sculptor-explorer.vercel.app"),
  title: "Sculpture in Data",
  description:
    "How sculpture evolved — materials, movements, geography, and lineages since 1800. " +
    `${dataSnapshot.includedSculptors.toLocaleString("en-US")} published sculptors from structured public data.`,
  openGraph: {
    title: "Sculpture in Data",
    description:
      `Explore ${dataSnapshot.includedSculptors.toLocaleString("en-US")} published sculptors ` +
      "and their movements, geographies, institutions, and recorded lineages since 1800.",
    type: "website",
    // Note: og:image is wired automatically by Next from app/opengraph-image.tsx;
    // we don't need to declare it here. Same for og:image:width/height/alt.
  },
  twitter: {
    card: "summary_large_image",
    title: "Sculpture in Data",
    description:
      `Explore ${dataSnapshot.includedSculptors.toLocaleString("en-US")} published sculptors ` +
      "and their recorded lineages since 1800.",
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
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-bg-primary text-text-primary font-body">
        {/* Responsive shell:
            - <md: column with top bar (MobileNav) + scrolling content
            - md+: row with sidebar (Nav) + scrolling content
            Both nav components self-gate by breakpoint, so they coexist
            in the tree without flicker. */}
        <div className="flex h-full flex-col md:flex-row">
          <Nav />
          <MobileNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
