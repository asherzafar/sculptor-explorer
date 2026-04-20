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

/**
 * The on-disk sculptor JSON shape (Option A.3 schema, Phase 3a+).
 *
 * Named "Legacy" for historical reasons — the rename to canonical
 * snake_case has been deferred. All new enrichment fields are camelCase
 * and optional so Phase 2 callers continue to work unchanged.
 */
export interface LegacySculptor {
  qid: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  alive: boolean;
  gender: string;
  movement: string;
  /** Primary citizenship (most-commonly-listed). */
  citizenship: string;
  birthDecade: number | null;
  inDegree: number;
  outDegree: number;
  totalDegree: number;

  // Phase 3a enrichment — all optional, omitted when Wikidata has no value
  /** Full list of distinct citizenships (for multi-citizenship / migration views). */
  citizenships?: string[];
  /** Birth city label (P19 → rdfs:label, English). */
  birthPlace?: string | null;
  /** Country of birth (P19 → P17 → rdfs:label). */
  birthCountry?: string | null;
  /** Death city label (P20 → rdfs:label, English). */
  deathPlace?: string | null;
  /** Country of death (P20 → P17 → rdfs:label). */
  deathCountry?: string | null;
  /** Name in native language (P1559). */
  nativeName?: string | null;
  /** Language code for nativeName (e.g. "ja", "ar", "de"). */
  nativeLang?: string | null;
  /** External authority file types present (ulan, viaf, lcnaf, bnf, dnb, ndl, bne). */
  authorityTypes?: string[];
  /** Total Wikipedia sitelinks (bot-dominated wikis excluded). */
  sitelinkCount?: number;
  /** Non-English Wikipedia sitelinks (bot-dominated wikis excluded). */
  nonEnSitelinkCount?: number;
  /** Which Option A.3 signals fired for this sculptor's inclusion. */
  inclusionSignals?: InclusionSignal[];
}

/** The five inclusion signals in Option A.3. Authority IDs are NOT a gate. */
export type InclusionSignal =
  | "movement"
  | "edge"
  | "focus"
  | "multi_citz"
  | "sitelinks";

/** @deprecated Use Edge (snake_case) once pipeline is updated. */
export interface LegacyEdge {
  fromQid: string;
  toQid: string;
  fromName: string;
  toName: string;
  relationType: "influenced_by" | "student_of";
}

/** A sculptor for the lifespan timeline (from Fabio's curated list). */
export interface TimelineSculptor {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number | null;
  birthDecade: number;
  movement?: string;
  citizenship?: string;
  source: "fabio" | "wikidata" | "pipeline";
}

/** Per-subset demographic breakdown used by the transparency page. */
export interface TransparencyBreakdown {
  total: number;
  gender?: Record<string, number>;
  topCitizenships?: Record<string, number>;
  byBirthDecade?: Record<string, number>;
}

/** Snapshot of Option A.3 inclusion criteria + demographic audit. */
export interface TransparencyAudit {
  generatedAt: string;
  totalCached: number;
  included: number;
  excluded: number;
  inclusionPctOfCache: number;
  signalCoverage: Record<InclusionSignal, number>;
  criterion: {
    version: string;
    rule: string;
    authorityIdsAsGate: boolean;
    sitelinkMinNonEnglish: number;
    botWikisExcluded: string[];
  };
  includedBreakdown: TransparencyBreakdown;
  excludedBreakdown: TransparencyBreakdown;
}
