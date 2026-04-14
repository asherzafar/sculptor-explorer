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
  title: "Sculpture in Data",
  description: "How sculpture evolved — materials, movements, geography, and lineages since 1800",
  openGraph: {
    title: "Sculpture in Data",
    description: "Explore how sculpture evolved across 200 years",
    type: "website",
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
