/** Data loading functions for JSON files. */

import type { LegacySculptor, LegacyEdge, DecadeAggregation, TimelineSculptor, TransparencyAudit, ExternalMentor } from "./types";

/** Load sculptors.json (legacy camelCase format) */
export async function loadSculptors(): Promise<LegacySculptor[]> {
  const res = await fetch("/data/sculptors.json");
  if (!res.ok) throw new Error("Failed to load sculptors.json");
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

/** Load external_mentors.json (non-sculptor endpoints of lineage edges). */
export async function loadExternalMentors(): Promise<ExternalMentor[]> {
  const res = await fetch("/data/external_mentors.json");
  if (!res.ok) throw new Error("Failed to load external_mentors.json");
  return res.json();
}
