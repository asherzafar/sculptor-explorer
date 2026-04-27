"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { LegacySculptor } from "@/lib/types";
import { loadSculptors } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";

/** Single data-completeness dot with tooltip. */
function CompletenessDot({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${present ? "present" : "missing"}`}
      className={`inline-block w-1.5 h-1.5 rounded-full ${
        present
          ? "bg-text-tertiary"
          : "border border-text-tertiary bg-transparent"
      }`}
      aria-label={`${label}: ${present ? "present" : "missing"}`}
    />
  );
}

export function SculptorDetail({ qid }: { qid: string }) {
  const router = useRouter();
  const [sculptor, setSculptor] = useState<LegacySculptor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sculptors = await loadSculptors();
        const found = sculptors.find((s) => s.qid === qid);
        setSculptor(found || null);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [qid]);

  // Back navigation: use router.back() when there's history (preserves explore state).
  // Falls back to /explore if user deep-linked (no history).
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/explore");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!sculptor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Sculptor not found</h1>
        <Link href="/explore" className="text-accent-primary hover:underline">
          ← Back to explore
        </Link>
      </div>
    );
  }

  const lifespanLine =
    sculptor.birthYear && sculptor.deathYear
      ? `${sculptor.birthYear} – ${sculptor.deathYear}`
      : sculptor.birthYear && sculptor.alive
        ? `${sculptor.birthYear} – present`
        : sculptor.birthYear
          ? `${sculptor.birthYear}`
          : "Unknown";

  const movementLabel = formatDisplayValue(sculptor.movement, { isMovement: true });
  const hasMovement = !!sculptor.movement && movementLabel !== "—";
  const hasCitizenship = !!sculptor.citizenship;
  const hasEdges = sculptor.totalDegree > 0;
  const hasGender = !!sculptor.gender;

  // Multi-citizenship: when Wikidata records more than one country we render
  // pills instead of a single inline string. This is the canonical "migration
  // canon" surface for the detail page — flat citizenship erases émigré
  // histories (Brâncuși, Nadelman, Bourgeois, Noguchi all read as just "USA"
  // without this).
  const allCitizenships = (sculptor.citizenships ?? []).filter(Boolean);
  const hasMultiCitizenship = allCitizenships.length > 1;
  const citizenshipLabel = hasCitizenship
    ? formatDisplayValue(sculptor.citizenship, { isName: true })
    : null;
  const genderLabel = hasGender ? formatGender(sculptor.gender) : null;

  // Place lines (Phase 3a enrichment — gracefully absent when Wikidata lacks data)
  const birthPlaceLine = [sculptor.birthPlace, sculptor.birthCountry]
    .filter(Boolean)
    .join(", ");
  const deathPlaceLine = [sculptor.deathPlace, sculptor.deathCountry]
    .filter(Boolean)
    .join(", ");
  const hasBirthPlace = !!birthPlaceLine;
  const hasDeathPlace = !!deathPlaceLine;
  // Only render the native-name subhead when the canonical form is actually
  // different from the romanized display name. Wikidata returns en-language
  // P1559 entries that just echo the name; rendering those would be visual
  // noise. ~1,185 of 3,630 sculptors have a meaningful non-English form.
  const hasNativeName =
    !!sculptor.nativeName &&
    !!sculptor.nativeLang &&
    sculptor.nativeLang !== "en" &&
    sculptor.nativeName !== sculptor.name;
  const authorityTypes = sculptor.authorityTypes ?? [];
  const authorityLinks = sculptor.authorityLinks ?? [];
  const hasAuthorities = authorityTypes.length > 0 || authorityLinks.length > 0;
  const signals = sculptor.inclusionSignals ?? [];

  // Human labels for inclusion signals (Option A.3). Shown as chips so a
  // curious reader can see *why* this sculptor made the cut.
  const SIGNAL_LABELS: Record<string, string> = {
    movement: "Art movement",
    edge: "Lineage edge",
    focus: "Curated focus",
    multi_citz: "Multi-citizenship",
    sitelinks: "Wikipedia reach",
  };

  // Authority-file link builders. We only render chips for types that have
  // a known URL template; types like "dnb" without an ID column stay as
  // non-linking labels.
  const AUTHORITY_LABELS: Record<string, string> = {
    ulan: "ULAN",
    viaf: "VIAF",
    lcnaf: "LCNAF",
    bnf: "BnF",
    dnb: "DNB",
    ndl: "NDL",
    bne: "BNE",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to explore
      </button>

      <div className="mt-8 max-w-2xl group relative">
        {/* Wikidata link — top-right, only visible on hover */}
        <a
          href={`https://www.wikidata.org/wiki/${sculptor.qid}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Wikidata"
          className="absolute top-1 right-0 inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Wikidata
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Name (Fraunces display) */}
        <h1 className="font-display text-4xl font-bold text-text-primary mb-1">
          {sculptor.name}
        </h1>

        {/* Native name line — if sculptor has a non-English canonical form */}
        {hasNativeName && (
          <p className="text-base text-text-tertiary mb-2" lang={sculptor.nativeLang ?? undefined}>
            {sculptor.nativeName}
            {sculptor.nativeLang && (
              <span className="ml-2 text-xs uppercase tracking-wide text-text-tertiary/70">
                {sculptor.nativeLang}
              </span>
            )}
          </p>
        )}

        {/* Lifespan line */}
        <p className="text-sm text-text-secondary mb-4">{lifespanLine}</p>

        {/* Movement pill — only if present */}
        {hasMovement && (
          <span className="inline-block rounded-full bg-accent-muted text-accent-primary text-xs font-medium px-3 py-1 mb-4">
            {movementLabel}
          </span>
        )}

        {/* Citizenship — pills when multi-, inline otherwise. Gender stays
            on its own line so it doesn't get visually conflated with country
            in the multi-citizenship case (those are different categories of
            information and shouldn't share punctuation). */}
        {hasMultiCitizenship && (
          <div className="mb-3">
            <p className="text-xs text-text-tertiary mb-1.5">Citizenships</p>
            <div className="flex flex-wrap gap-1.5">
              {allCitizenships.map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="inline-block rounded-full bg-bg-secondary text-text-secondary text-xs px-2.5 py-0.5"
                >
                  {formatDisplayValue(c, { isName: true })}
                </span>
              ))}
            </div>
          </div>
        )}
        {!hasMultiCitizenship && citizenshipLabel && (
          <p className="text-sm text-text-secondary mb-3">{citizenshipLabel}</p>
        )}
        {genderLabel && (
          <p className="text-sm text-text-secondary mb-3">{genderLabel}</p>
        )}

        {/* Place-of-birth / place-of-death */}
        {(hasBirthPlace || hasDeathPlace) && (
          <div className="text-sm text-text-secondary mb-3 space-y-0.5">
            {hasBirthPlace && (
              <p>
                <span className="text-text-tertiary">Born in</span>{" "}
                {birthPlaceLine}
              </p>
            )}
            {hasDeathPlace && (
              <p>
                <span className="text-text-tertiary">Died in</span>{" "}
                {deathPlaceLine}
              </p>
            )}
          </div>
        )}

        {/* Connections — only if > 0 */}
        {hasEdges && (
          <p className="text-sm text-text-secondary mb-4">
            {sculptor.totalDegree} connection{sculptor.totalDegree === 1 ? "" : "s"}
            {" "}
            <span className="text-text-tertiary">
              ({sculptor.inDegree} in, {sculptor.outDegree} out)
            </span>
          </p>
        )}

        {/* Authority-file chips — link out to VIAF/ULAN/etc. when we have
            a resolved URL, fall back to a static badge otherwise. */}
        {hasAuthorities && (
          <div className="mb-4">
            <p className="text-xs text-text-tertiary mb-1.5">Authority files</p>
            <div className="flex flex-wrap gap-1.5">
              {(authorityLinks.length > 0
                ? authorityLinks
                : authorityTypes.map((t) => ({ type: t, id: null, url: null }))
              ).map((link) => {
                const label =
                  AUTHORITY_LABELS[link.type] ?? link.type.toUpperCase();
                const title = link.id
                  ? `${label} · ${link.id}`
                  : `${label} identifier present`;
                const baseCls =
                  "inline-block rounded-sm border text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5";
                if (link.url) {
                  return (
                    <a
                      key={link.type}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={title}
                      className={`${baseCls} border-accent-primary/30 bg-bg-secondary text-accent-primary hover:bg-accent-muted/40 transition-colors`}
                    >
                      {label}
                    </a>
                  );
                }
                return (
                  <span
                    key={link.type}
                    title={title}
                    className={`${baseCls} border-text-tertiary/30 bg-bg-secondary text-text-secondary`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Inclusion signals — why this sculptor is in the A.3 set */}
        {signals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-tertiary mb-1.5">
              Included because of
            </p>
            <div className="flex flex-wrap gap-1.5">
              {signals.map((s) => (
                <span
                  key={s}
                  className="inline-block rounded-full bg-accent-muted/50 text-accent-primary text-[10px] font-medium px-2 py-0.5"
                >
                  {SIGNAL_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Data completeness dots */}
        <div className="flex items-center gap-1.5 mt-6" aria-label="Data completeness">
          <CompletenessDot present={hasMovement} label="Movement" />
          <CompletenessDot
            present={hasCitizenship}
            label={hasMultiCitizenship ? "Citizenships (multi)" : "Citizenship"}
          />
          <CompletenessDot present={hasBirthPlace} label="Birth place" />
          <CompletenessDot present={hasNativeName} label="Native name" />
          <CompletenessDot present={hasEdges} label="Connections" />
          <CompletenessDot present={hasAuthorities} label="Authority files" />
          <span className="ml-2 text-xs text-text-tertiary">Data completeness</span>
        </div>
      </div>
    </div>
  );
}
