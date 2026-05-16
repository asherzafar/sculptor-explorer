import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { DecadeView } from "./DecadeView";

/**
 * /decade/[year]/page.tsx — server wrapper for a single decade page.
 *
 * generateStaticParams reads `decades.json` at build time so each decade
 * with data gets a prerendered HTML page (Next.js static export). Years
 * are stored as the decade-start integer (1920 → "1920s") to match the
 * shape used everywhere else in the codebase.
 */
function readDecades(): Record<string, unknown> {
  const filePath = path.join(process.cwd(), "public", "data", "decades.json");
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

export function generateStaticParams() {
  const decades = readDecades();
  return Object.keys(decades).map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const decades = readDecades();
  const entry = decades[year] as { totalBorn?: number } | undefined;
  if (!entry) {
    return { title: `${year}s` };
  }
  return {
    title: `${year}s — Sculpture in Data`,
    description: `${entry.totalBorn ?? 0} sculptors born in the ${year}s, with their movements, geography, and migration corridors.`,
  };
}

export default async function DecadePage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return <DecadeView year={year} />;
}
