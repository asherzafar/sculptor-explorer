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
 * One external authority-file entry: type + ID + resolved outbound URL.
 * url may be null for types without a templated formatter URL.
 */
export interface AuthorityLink {
  type: "ulan" | "viaf" | "lcnaf" | "bnf" | "dnb" | "ndl" | "bne";
  id: string | null;
  url: string | null;
}

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
  /** Per-authority entries with ID + outbound URL. */
  authorityLinks?: AuthorityLink[];
  /** Total Wikipedia sitelinks (bot-dominated wikis excluded). */
  sitelinkCount?: number;
  /** Non-English Wikipedia sitelinks (bot-dominated wikis excluded). */
  nonEnSitelinkCount?: number;
  /** Which Option A.3 signals fired for this sculptor's inclusion. */
  inclusionSignals?: InclusionSignal[];

  /**
   * Phase 3b — Getty ULAN cross-reference.
   *
   * Present only for the ~64% of sculptors whose Wikidata records carry
   * a ULAN ID (P245). Holds Getty's parallel data plus per-field
   * agreement flags computed against the Wikidata record at export time.
   * The UI uses this to (a) fill birth/death-place gaps when Wikidata
   * lacks them and (b) show a small "Verified by Getty" or "Sources
   * differ" affordance.
   */
  gettyVerified?: GettyVerified;
}

export interface GettyVerified {
  ulanId: string | null;
  url: string | null;
  /** Getty's preferred display form, e.g. "Brancusi, Constantin" — last-name-first. */
  label: string | null;
  birthYear: number | null;
  birthPlace: string | null;
  deathYear: number | null;
  deathPlace: string | null;
  /**
   * Cultural-attribution chips in Getty's model. NOT legally equivalent
   * to Wikidata's `citizenships[]` — Getty uses adjective form
   * ("French", "Romanian"). Treat as parallel evidence, not authority.
   */
  nationalities: string[];
  agreement: {
    /** "match" | "off1" | "off_big" | "missing" */
    birthYear: string | null;
    deathYear: string | null;
    /** null = one or both sources lack the data; can't compare. */
    birthPlace: boolean | null;
    deathPlace: boolean | null;
    /** Jaccard similarity of nationality sets after adjective→country mapping. */
    natJaccard: number | null;
  };
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
  /**
   * Phase 4 — cross-cultural collaboration flag.
   *   true  → the two sculptors had no shared citizenship (émigré /
   *           cross-border training/influence).
   *   false → both endpoints share at least one citizenship.
   *   null  → not classifiable, typically because the FROM endpoint
   *           is an external mentor (no citizenship data fetched).
   * Tri-state preserved deliberately so denominators stay honest.
   */
  crossesBorders: boolean | null;
}

/**
 * Phase 4 — aggregate stats for the cross-cultural collaboration story.
 * Generated by `pipeline/export_json.py :: create_cross_cultural_summary`.
 */
export interface CrossCulturalSummary {
  totalEdges: number;
  comparable: number;
  crossBorder: number;
  sameNationality: number;
  crossPctOfComparable: number | null;
  byDecade: Array<{
    decade: number;
    total: number;
    cross: number;
    same: number;
  }>;
  topPairs: Array<{ a: string; b: string; count: number }>;
}

/**
 * An external mentor — a non-sculptor endpoint of a lineage edge.
 *
 * These are painters, composers, architects, and other teachers who
 * trained or influenced sculptors but aren't classified as sculptors
 * themselves in Wikidata. They're rendered as first-class nodes on the
 * lineage graph with distinct styling so lineage arcs don't terminate
 * in empty space.
 */
export interface ExternalMentor {
  qid: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  gender: string | null;
  occupation: string | null;
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

/**
 * Phase 3b — Wikidata ↔ Getty cross-reference audit. Populated by
 * `pipeline/audit_getty.py`, consumed by `/transparency`.
 */
export interface GettyAudit {
  version: number;
  aggregate: {
    compared: number;
    birth_year: {
      comparable: number;
      exact_match: number;
      off_by_1: number;
      off_by_more: number;
      missing_one_or_both: number;
    };
    death_year: {
      comparable: number;
      exact_match: number;
      off_by_1: number;
      off_by_more: number;
      missing_one_or_both: number;
    };
    birth_place: {
      wd_present: number;
      getty_present: number;
      both_present: number;
      agreement_rate: number | null;
      getty_fills_wd_gap: number;
      wd_fills_getty_gap: number;
    };
    death_place: {
      wd_present: number;
      getty_present: number;
      both_present: number;
      agreement_rate: number | null;
      getty_fills_wd_gap: number;
      wd_fills_getty_gap: number;
    };
    nationality: {
      comparable: number;
      mean_jaccard: number | null;
      full_agreement: number;
      any_overlap: number;
      no_overlap: number;
      getty_adds_country: number;
      wd_adds_country: number;
    };
  };
  samples: {
    birth_year_off_by_more: Array<Record<string, unknown>>;
    birth_place_disagree: Array<Record<string, unknown>>;
    getty_fills_birthplace_gap: Array<Record<string, unknown>>;
    nationality_no_overlap: Array<Record<string, unknown>>;
    nationality_getty_adds: Array<Record<string, unknown>>;
  };
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
