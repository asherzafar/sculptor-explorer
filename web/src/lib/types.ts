/**
 * TypeScript interfaces for all data structures.
 *
 * Canonical types (from docs/ARCHITECTURE.md) use snake_case to match
 * the target JSON schema. Legacy types (camelCase) remain for backward
 * compatibility with the current seed JSON files and will be removed
 * once the pipeline re-exports in snake_case.
 */

// ---------------------------------------------------------------------------
// Canonical types (target schema from ARCHITECTURE.md)
// ---------------------------------------------------------------------------

export interface Sculptor {
  qid: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  gender: string | null;
  movement: string | null;
  citizenship: string | null;
  birth_decade: number;
  in_degree: number;
  out_degree: number;
  total_degree: number;
  is_focus: boolean;
}

export interface Edge {
  from_qid: string;
  from_name: string;
  to_qid: string;
  to_name: string;
  relation_type: string;
}

export interface DecadeAggregation {
  decade: number;
  category: string;
  count: number;
}

export type SculptorsJSON = Sculptor[];
export type EdgesJSON = Edge[];
export type MovementsByDecadeJSON = DecadeAggregation[];
export type GeographyByDecadeJSON = DecadeAggregation[];
export type MaterialsByDecadeJSON = DecadeAggregation[];
export type FocusSculptorsJSON = Sculptor[];

// ---------------------------------------------------------------------------
// Legacy types (camelCase — matches current seed JSON files)
// Remove these once the pipeline re-exports with snake_case keys.
// ---------------------------------------------------------------------------

/** @deprecated Use Sculptor (snake_case) once pipeline is updated. */
export interface LegacySculptor {
  qid: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  alive: boolean;
  gender: string;
  movement: string;
  citizenship: string;
  birthDecade: number | null;
  inDegree: number;
  outDegree: number;
  totalDegree: number;
}

/** @deprecated Use Edge (snake_case) once pipeline is updated. */
export interface LegacyEdge {
  fromQid: string;
  toQid: string;
  fromName: string;
  toName: string;
  relationType: "influenced_by" | "student_of";
}

/** @deprecated Use DecadeAggregation once pipeline is updated. */
export interface MovementByDecade {
  decade: number;
  total: number;
  [movement: string]: number;
}

/** @deprecated Use DecadeAggregation once pipeline is updated. */
export interface GeographyByDecade {
  decade: number;
  total: number;
  unknown: number;
  [country: string]: number;
}

/** @deprecated Use DecadeAggregation once pipeline is updated. */
export interface MaterialByDecade {
  decade: number;
  total: number;
  [material: string]: number;
}

/** A sculptor for the lifespan timeline (from Fabio's curated list). */
export interface TimelineSculptor {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number | null;
  birthDecade: number;
  source: "fabio" | "wikidata";
}
