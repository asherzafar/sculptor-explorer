/** TypeScript interfaces for all data structures. */

/** Core sculptor data structure. */
export interface Sculptor {
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

/** Relationship edge between sculptors. */
export interface Edge {
  fromQid: string;
  toQid: string;
  fromName: string;
  toName: string;
  relationType: "influenced_by" | "student_of";
}

/** Decade-aggregated movement data. */
export interface MovementByDecade {
  decade: number;
  total: number;
  [movement: string]: number;
}

/** Decade-aggregated geography data. */
export interface GeographyByDecade {
  decade: number;
  total: number;
  unknown: number;
  [country: string]: number;
}

/** Decade-aggregated materials data. */
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
