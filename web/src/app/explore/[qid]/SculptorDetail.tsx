"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowLeft } from "lucide-react";
import type { LegacyEdge, LegacySculptor } from "@/lib/types";
import { loadEdges, loadSculptor } from "@/lib/data";
import { formatDisplayValue, formatGender } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { WorksGallery } from "@/components/WorksGallery";

/**
 * Portrait — Phase 4 visual polish.
 *
 * Renders the Wikimedia Commons portrait for a sculptor when Wikidata
 * has a P18 image. Notes:
 *
 * - The Commons FilePath URL serves the original file at any size, but
 *   we always request a thumbnail (`?width=400`) so a sculptor with a
 *   30MB TIFF doesn't blow out the page.
 * - Some Wikidata P18 URLs come back as `http://` (not https). Commons
 *   redirects, but we upgrade up-front to avoid mixed-content warnings.
 * - We use a plain <img> rather than next/image because the static
 *   export build can't run the image optimizer, and Commons already
 *   serves appropriate thumbnails.
 * - Attribution is required by Commons reuse policy. We give a short
 *   link back to the file page so the reader can see licence + author
 *   in one click.
 */
function Portrait({ src, alt }: { src: string; alt: string }) {
  const httpsSrc = src.replace(/^http:\/\//, "https://");
  const thumbSrc = `${httpsSrc}?width=400`;
  // Derive the Commons file page URL from the FilePath URL so the
  // attribution link points at metadata (author + licence), not the raw
  // bitstream. Special:FilePath/<file> ↔ wiki/File:<file>.
  const fileMatch = httpsSrc.match(/Special:FilePath\/(.+?)$/);
  const filePageUrl = fileMatch
    ? `https://commons.wikimedia.org/wiki/File:${fileMatch[1]}`
    : httpsSrc;

  return (
    <figure className="float-right ml-6 mb-4 w-32 sm:w-40">
      <a
        href={filePageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title="View on Wikimedia Commons"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={alt}
          loading="lazy"
          className="w-full h-auto rounded-sm border border-border-subtle"
        />
      </a>
      <figcaption className="mt-1 text-[10px] uppercase tracking-wide text-text-tertiary">
        Wikimedia Commons
      </figcaption>
    </figure>
  );
}

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
  // edges loaded alongside the sculptor so we can compute the
  // per-sculptor cross-cultural connection count without a second
  // round-trip. The full edges payload is small (~150KB) and already
  // cached by other pages.
  const [edges, setEdges] = useState<LegacyEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Single-sculptor shard (~1.2KB) instead of the full 5.9MB
        // sculptors.json. Edges still loads in parallel since the
        // detail page needs it for the per-sculptor connection list.
        const [found, allEdges] = await Promise.all([
          loadSculptor(qid),
          loadEdges(),
        ]);
        setSculptor(found);
        setEdges(allEdges);
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
        <LoadingState />
      </div>
    );
  }

  if (!sculptor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Sculptor not found"
          description={`No record matches the QID "${qid}". The link may be stale or the sculptor may have been excluded by the inclusion criteria — see /transparency for what's filtered.`}
          action={
            <Link
              href="/explore"
              className="text-sm text-accent-primary hover:underline"
            >
              ← Back to explore
            </Link>
          }
        />
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

  // Phase 4 — per-sculptor cross-cultural connection count. Only
  // counts edges where this sculptor appears as an endpoint AND the
  // edge has a classifiable `crossesBorders` flag (excludes external-
  // mentor edges where citizenship data is missing on one side).
  const myCrossBorderCount = edges.reduce((n, e) => {
    if (e.crossesBorders !== true) return n;
    return n + (e.fromQid === qid || e.toQid === qid ? 1 : 0);
  }, 0);
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

  // Phase 3b — Getty cross-reference. Two surfaces:
  //  1. Gap-fill: when Wikidata has no birth/death place but Getty does,
  //     render Getty's value with a small "(via Getty)" attribution.
  //  2. Cross-reference status: a one-line affordance near the lifespan
  //     summarising whether the two sources agree. Only render when
  //     there's something to say — silent agreement isn't useful chrome.
  const getty = sculptor.gettyVerified ?? null;
  const gettyFillsBirth = !!getty && !hasBirthPlace && !!getty.birthPlace;
  const gettyFillsDeath = !!getty && !hasDeathPlace && !!getty.deathPlace;

  type CrossRefState = "verified" | "differs" | null;
  function computeCrossRefState(): CrossRefState {
    if (!getty) return null;
    const a = getty.agreement;
    const substantiveDisagreement =
      a.birthYear === "off_big" ||
      a.deathYear === "off_big" ||
      a.birthPlace === false ||
      a.deathPlace === false ||
      a.natJaccard === 0;
    if (substantiveDisagreement) return "differs";
    // We require at least one positive comparison — otherwise we have a
    // record but nothing to verify against, which is "no signal" rather
    // than "verified."
    const positiveComparisons =
      a.birthYear === "match" ||
      a.deathYear === "match" ||
      a.birthPlace === true ||
      a.deathPlace === true ||
      (a.natJaccard !== null && a.natJaccard > 0);
    return positiveComparisons ? "verified" : null;
  }
  const crossRefState = computeCrossRefState();
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
        className="group inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
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

        {/* Portrait — floats right of the header block so the lifespan,
            native name, and Getty cross-ref text wrap alongside it.
            Renders only when Wikidata has a P18 image (~33% coverage at
            time of writing); absence is silent rather than a placeholder. */}
        {sculptor.image && (
          <Portrait src={sculptor.image} alt={`Portrait of ${sculptor.name}`} />
        )}

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
        <p className="text-sm text-text-secondary mb-1">{lifespanLine}</p>

        {/* Cross-reference status — Phase 3b. We only render when there's
            something to communicate (verified / differs); silent agreement
            isn't worth the visual weight. The link goes to the Getty
            record so curious readers can audit. */}
        {crossRefState && getty && (
          <p
            className={`text-xs mb-4 ${
              crossRefState === "verified"
                ? "text-accent-primary"
                : "text-text-tertiary"
            }`}
          >
            {crossRefState === "verified"
              ? "✓ Cross-referenced with Getty ULAN"
              : "△ Differs from Getty ULAN"}
            {getty.url && (
              <>
                {" · "}
                <a
                  href={getty.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  view Getty record
                </a>
              </>
            )}
          </p>
        )}
        {!crossRefState && <div className="mb-3" />}

        {/* Movement pill — only if present.
            Note (Phase 4): movement absence is rendered explicitly rather
            than silently hidden. ~73% of included sculptors have no
            recorded movement on Wikidata, so silently dropping the line
            implied data we do not have. The muted "—" framing is
            deliberately small so it doesn't compete with the lifespan and
            citizenship lines, but it does tell the reader we checked. */}
        {hasMovement ? (
          <span className="inline-block rounded-full bg-accent-muted text-accent-primary text-xs font-medium px-3 py-1 mb-4">
            {movementLabel}
          </span>
        ) : (
          <p className="text-xs text-text-tertiary mb-4">
            No art movement listed on Wikidata for this sculptor.
          </p>
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

        {/* Place-of-birth / place-of-death. When Wikidata lacks the
            place but Getty has it (Phase 3b), surface Getty's value
            with a small attribution so the user can tell which source
            said what. Phase 4: when neither source has a place we still
            render a muted "not recorded" line — silently hiding the
            block lied about whether we checked. We collapse to a single
            line if only one of birth/death is missing so the absence
            doesn't dominate the layout. */}
        <div className="text-sm text-text-secondary mb-3 space-y-0.5">
          {hasBirthPlace ? (
            <p>
              <span className="text-text-tertiary">Born in</span>{" "}
              {birthPlaceLine}
            </p>
          ) : gettyFillsBirth && getty?.birthPlace ? (
            <p>
              <span className="text-text-tertiary">Born in</span>{" "}
              {getty.birthPlace}
              <span className="ml-1.5 text-xs italic text-text-tertiary">
                (via Getty)
              </span>
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">
              Birthplace not recorded on Wikidata
              {getty ? " or Getty" : ""}.
            </p>
          )}
          {hasDeathPlace ? (
            <p>
              <span className="text-text-tertiary">Died in</span>{" "}
              {deathPlaceLine}
            </p>
          ) : gettyFillsDeath && getty?.deathPlace ? (
            <p>
              <span className="text-text-tertiary">Died in</span>{" "}
              {getty.deathPlace}
              <span className="ml-1.5 text-xs italic text-text-tertiary">
                (via Getty)
              </span>
            </p>
          ) : (
            // Death-place absence is only worth showing for non-living
            // sculptors. Suppressing it for the alive case avoids a
            // confusing "Death place not recorded" on a living person.
            sculptor.deathYear || !sculptor.alive ? (
              <p className="text-xs text-text-tertiary">
                Place of death not recorded.
              </p>
            ) : null
          )}
        </div>

        {/* Connections — only if > 0. Phase 4 appends a cross-border
            count when any of the connections cross national lines, so
            émigré sculptors' international training shows up at a
            glance. */}
        {hasEdges && (
          <p className="text-sm text-text-secondary mb-4">
            {sculptor.totalDegree} connection{sculptor.totalDegree === 1 ? "" : "s"}
            {" "}
            <span className="text-text-tertiary">
              ({sculptor.inDegree} in, {sculptor.outDegree} out)
            </span>
            {myCrossBorderCount > 0 && (
              <>
                {" · "}
                <span className="text-accent-primary">
                  {myCrossBorderCount} cross{" "}
                  {myCrossBorderCount === 1 ? "border" : "borders"}
                </span>
              </>
            )}
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

      {/* Works gallery — public-domain images from Met + AIC. Renders
          nothing when the sculptor has no museum coverage, so the
          absence is silent rather than an error state. */}
      <WorksGallery works={sculptor.works} sculptorName={sculptor.name} />
    </div>
  );
}
