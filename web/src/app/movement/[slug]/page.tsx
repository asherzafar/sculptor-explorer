import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { MovementView } from "./MovementView";

/**
 * /movement/[slug]/page.tsx — server wrapper for one movement page.
 *
 * Slug source of truth is `pipeline/export_json.py :: _movement_slug`.
 * That function emits the slug onto every record in `movements.json`,
 * so we never re-derive it client-side — the routes always match.
 */
function readMovementsBundle(): {
  movements: Record<string, unknown>;
  index: Array<{ slug: string }>;
} {
  const filePath = path.join(process.cwd(), "public", "data", "movements.json");
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return { movements: {}, index: [] };
  }
}

export function generateStaticParams() {
  const { movements } = readMovementsBundle();
  return Object.keys(movements).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { movements } = readMovementsBundle();
  const entry = movements[slug] as
    | { name?: string; total?: number; peakDecade?: number | null }
    | undefined;
  if (!entry?.name) {
    return { title: slug };
  }
  return {
    title: `${entry.name} — Sculpture in Data`,
    description: `${entry.total ?? 0} sculptors associated with ${entry.name}${
      entry.peakDecade ? `, peaking in the ${entry.peakDecade}s` : ""
    }.`,
  };
}

export default async function MovementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MovementView slug={slug} />;
}
