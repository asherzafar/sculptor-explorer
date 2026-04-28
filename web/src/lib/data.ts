/** Data loading functions for JSON files. */

import type { LegacySculptor, LegacyEdge, DecadeAggregation, TimelineSculptor, TransparencyAudit, ExternalMentor } from "./types";

/** Load sculptors.json (legacy camelCase format) */
export async function loadSculptors(): Promise<LegacySculptor[]> {
  const res = await fetch("/data/sculptors.json");
  if (!res.ok) throw new Error("Failed to load sculptors.json");
  return res.json();
}

/** Load a single sculptor by qid from its per-sculptor shard.
 *
 * The detail page uses this instead of `loadSculptors()` because the
 * aggregate file is ~5.9MB and we only need one ~1.2KB record. Shards
 * are emitted by `pipeline/export_json.py` under /data/sculptors/.
 *
 * Returns null for unknown QIDs (404) so the caller can render the
 * not-found state rather than treat it as a network error.
 */
export async function loadSculptor(qid: string): Promise<LegacySculptor | null> {
  const res = await fetch(`/data/sculptors/${qid}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load sculptor ${qid}`);
  return res.json();
}

/** Load edges.json (legacy camelCase format) */
export async function loadEdges(): Promise<LegacyEdge[]> {
  const res = await fetch("/data/edges.json");
  if (!res.ok) throw new Error("Failed to load edges.json");
  return res.json();
}

/** Load movements_by_decade.json (tidy format: {decade, category, count}) */
export async function loadMovementsByDecade(): Promise<DecadeAggregation[]> {
  const res = await fetch("/data/movements_by_decade.json");
  if (!res.ok) throw new Error("Failed to load movements_by_decade.json");
  return res.json();
}

/** Load geography_by_decade.json (tidy format: {decade, category, count}) */
export async function loadGeographyByDecade(): Promise<DecadeAggregation[]> {
  const res = await fetch("/data/geography_by_decade.json");
  if (!res.ok) throw new Error("Failed to load geography_by_decade.json");
  return res.json();
}

/** Load focus_sculptors.json (legacy camelCase format) */
export async function loadFocusSculptors(): Promise<LegacySculptor[]> {
  const res = await fetch("/data/focus_sculptors.json");
  if (!res.ok) throw new Error("Failed to load focus_sculptors.json");
  return res.json();
}

/** Load materials_by_decade.json (tidy format: {decade, category, count}) */
export async function loadMaterialsByDecade(): Promise<DecadeAggregation[]> {
  const res = await fetch("/data/materials_by_decade.json");
  if (!res.ok) throw new Error("Failed to load materials_by_decade.json");
  return res.json();
}

/** Load timeline_sculptors.json (Fabio's curated list) */
export async function loadTimelineSculptors(): Promise<TimelineSculptor[]> {
  const res = await fetch("/data/timeline_sculptors.json");
  if (!res.ok) throw new Error("Failed to load timeline_sculptors.json");
  return res.json();
}

/** Load transparency.json (Option A.3 demographic audit). */
export async function loadTransparency(): Promise<TransparencyAudit> {
  const res = await fetch("/data/transparency.json");
  if (!res.ok) throw new Error("Failed to load transparency.json");
  return res.json();
}

/**
 * Load cross_cultural_summary.json (Phase 4 collaboration story).
 * Returns null on missing file so the page can gracefully omit the
 * section pre-pipeline-rerun.
 */
export async function loadCrossCulturalSummary(): Promise<
  import("./types").CrossCulturalSummary | null
> {
  try {
    const res = await fetch("/data/cross_cultural_summary.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Load getty_audit.json (Phase 3b Wikidata↔Getty cross-reference). Returns
 * null when the file isn't present yet — the pipeline only produces it
 * after Getty ingest, so first-run builds before that step should
 * gracefully omit the section instead of erroring.
 */
export async function loadGettyAudit(): Promise<import("./types").GettyAudit | null> {
  try {
    const res = await fetch("/data/getty_audit.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Load geography_by_birth_country.json — place-of-birth aggregation. */
export async function loadGeographyByBirthCountry(): Promise<DecadeAggregation[]> {
  const res = await fetch("/data/geography_by_birth_country.json");
  if (!res.ok) throw new Error("Failed to load geography_by_birth_country.json");
  return res.json();
}

/** Load external_mentors.json (non-sculptor endpoints of lineage edges). */
export async function loadExternalMentors(): Promise<ExternalMentor[]> {
  const res = await fetch("/data/external_mentors.json");
  if (!res.ok) throw new Error("Failed to load external_mentors.json");
  return res.json();
}
