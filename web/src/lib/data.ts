/** Data loading functions for JSON files. */

import type { LegacySculptor, LegacyEdge, MovementByDecade, GeographyByDecade, MaterialByDecade, TimelineSculptor } from "./types";

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

/** Load movements_by_decade.json */
export async function loadMovementsByDecade(): Promise<MovementByDecade[]> {
  const res = await fetch("/data/movements_by_decade.json");
  if (!res.ok) throw new Error("Failed to load movements_by_decade.json");
  return res.json();
}

/** Load geography_by_decade.json */
export async function loadGeographyByDecade(): Promise<GeographyByDecade[]> {
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

/** Load materials_by_decade.json */
export async function loadMaterialsByDecade(): Promise<MaterialByDecade[]> {
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
