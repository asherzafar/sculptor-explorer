"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { loadDecades } from "@/lib/data";
import type { DecadesData, DecadeStats } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { NotableSculptorCard } from "@/components/NotableSculptorCard";
import { StatBlock } from "@/components/StatBlock";
import { DataScopeNote } from "@/components/DataScopeNote";

/**
 * DecadeView — renders one /decade/[year] page.
 *
 * Layout is intentionally a single-column long-read rather than a
 * dashboard grid: each decade page is a story (top countries, top
 * movements, who the canon's network knows about, where they went) so
 * the visual rhythm follows section-by-section rather than tile-by-tile.
 *
 * Adjacent-decade nav at top + bottom turns the per-decade pages into a
 * navigable sequence — clicking through 1880s → 1890s → 1900s should
 * feel like turning pages, not back-button shuffling.
 */
export function DecadeView({ year }: { year: string }) {
  const [data, setData] = useState<DecadesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadDecades().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedDecades = useMemo(
    () =>
      data
        ? Object.keys(data)
            .map((k) => Number(k))
            .sort((a, b) => a - b)
        : [],
    [data]
  );

  const yearNum = Number(year);
  const idx = sortedDecades.indexOf(yearNum);
  const prev = idx > 0 ? sortedDecades[idx - 1] : null;
  const next = idx >= 0 && idx < sortedDecades.length - 1 ? sortedDecades[idx + 1] : null;

  const decade: DecadeStats | undefined = data?.[year];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label={`Loading ${year}s data`} />
      </div>
    );
  }

  if (!decade) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          eyebrow={
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Timeline
            </Link>
          }
          title={`${year}s`}
        />
        <EmptyState
          variant="block"
          title="No data for this decade"
          description="No sculptors in the published set were born in this decade. Check the URL or browse the full Timeline."
        />
      </div>
    );
  }

  const genderTotal =
    decade.gender.female + decade.gender.male + decade.gender.otherOrUnknown;
  const femaleLabelPct =
    genderTotal > 0
      ? Math.round((decade.gender.female / genderTotal) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        eyebrow={
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1 hover:text-accent-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Timeline
          </Link>
        }
        title={`The ${year}s`}
        subtitle={`${decade.totalBorn.toLocaleString()} sculptors in the published set were born in this decade.${
          decade.migration.crossPct != null
            ? ` ${decade.migration.crossPct}% of those with both endpoint countries recorded have different birth and death countries.`
            : ""
        }`}
        actions={
          <DecadeNav prev={prev} next={next} />
        }
      />

      <DataScopeNote
        className="mb-6"
        source="Published Wikidata records: P569/P570 for dates, P21 for recorded gender, P19/P20 → P17 for endpoint countries, P135 for movements, and P737/P1066 for graph degree."
        scope={`${decade.totalBorn.toLocaleString()} published sculptors born in the ${year}s; endpoint-country percentages use ${decade.migration.eligible.toLocaleString()} non-living records with both countries.`}
        limits="Gender categories reproduce source labels and are not inferred. Country and movement lists show only leading recorded categories; their percentages use the full decade cohort, so missing and long-tail values remain outside the displayed bars. Endpoint-country differences do not reconstruct migration paths."
      />

      {/* Headline grid — three small stat blocks summarizing the decade. */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label="Recorded gender (Wikidata P21)"
          value={`${femaleLabelPct}%`}
          sub={`${decade.gender.female} of ${genderTotal} labeled female · ${decade.gender.otherOrUnknown} other labels or unknown`}
        />
        <StatBlock
          label="Different endpoint countries"
          value={
            decade.migration.crossPct != null
              ? `${decade.migration.crossPct}%`
              : "—"
          }
          sub={
            decade.migration.eligible > 0
              ? `${decade.migration.crossed} of ${decade.migration.eligible} eligible`
              : // Cohorts born after ~1960 are mostly still living, so we
                // don't yet know where they will end up dying. Be explicit
                // about that rather than implying the data is sparse.
                yearNum >= 1960
                ? "Cohort still living"
                : "Too few records to compare"
          }
          accent
        />
        <StatBlock
          label="Top art movement"
          value={
            decade.topMovements[0]?.movement
              ? decade.topMovements[0].movement
              : "—"
          }
          sub={
            decade.topMovements[0]
              ? `${decade.topMovements[0].count} sculptors associated`
              : "No movement label dominant"
          }
        />
      </div>

      {/* Two-column: countries + movements */}
      <div className="grid gap-8 md:grid-cols-2 mb-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Countries of birth
          </h2>
          {decade.topCountries.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No birth-country data on record for this decade.
            </p>
          ) : (
            <RankedBars
              items={decade.topCountries.map((c) => ({
                label: c.country,
                count: c.count,
              }))}
              total={decade.totalBorn}
            />
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Art movements
          </h2>
          {decade.topMovements.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No movement labels recorded.
            </p>
          ) : (
            <RankedBars
              items={decade.topMovements.map((m) => ({
                label: m.movement,
                count: m.count,
              }))}
              total={decade.totalBorn}
            />
          )}
        </section>
      </div>

      {/* Top corridors — only if any */}
      {decade.topCorridors.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Top migration corridors
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            The most frequent recorded birth-country → death-country pairs
            among eligible sculptors born in the {year}s. These endpoints do
            not show the route, timing, or reason for movement.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {decade.topCorridors.map((f, i) => (
              <li
                key={`${f.from}->${f.to}`}
                className="rounded-md bg-bg-secondary p-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-tertiary tabular-nums w-5">
                    {i + 1}.
                  </span>
                  <span className="font-medium text-text-primary">
                    {f.from}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                  <span className="font-medium text-text-primary">{f.to}</span>
                  <span className="ml-auto text-text-tertiary tabular-nums">
                    {f.count}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href={`/migration?decade=${year}`}
            className="mt-3 inline-flex items-center gap-1 text-sm text-accent-primary hover:text-accent-hover transition-colors"
          >
            See the full Sankey for the {year}s
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      )}

      {/* Most-connected sculptors in this graph */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Most-connected sculptors in this graph
          </h2>
          <span className="text-sm text-text-tertiary">
            Top {decade.notable.length} by lineage connections
          </span>
        </div>
        {decade.notable.length === 0 ? (
          <EmptyState
            variant="block"
            title="No connected sculptors found"
            description="The published set has no entries for this decade. This is rare — check the URL."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {decade.notable.map((s) => (
              <NotableSculptorCard key={s.qid} sculptor={s} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom decade nav — same component as header, doubled here so a
          reader at the bottom of a long roster doesn't have to scroll up
          to flip pages. */}
      <div className="flex justify-center pt-6 border-t border-border-subtle">
        <DecadeNav prev={prev} next={next} verbose />
      </div>
    </div>
  );
}

// ── small components, page-local ────────────────────────────────────────

interface RankedItem {
  label: string;
  count: number;
}

function RankedBars({
  items,
  total,
}: {
  items: RankedItem[];
  total: number;
}) {
  // Bar lengths normalize against the *largest* item, not the decade
  // total — using the total would crush every bar to a tiny sliver
  // because no one country owns >40% of any decade.
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const pctOfMax = (item.count / maxCount) * 100;
        const pctOfTotal = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={item.label} className="text-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-text-primary truncate">
                {item.label}
              </span>
              <span className="text-text-tertiary tabular-nums shrink-0">
                {item.count} <span className="text-xs">({pctOfTotal}%)</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full bg-accent-primary"
                style={{ width: `${pctOfMax}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DecadeNav({
  prev,
  next,
  verbose = false,
}: {
  prev: number | null;
  next: number | null;
  verbose?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {prev != null ? (
        <Link
          href={`/decade/${prev}`}
          aria-label={`Previous decade, ${prev}s`}
          className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {verbose ? `${prev}s` : <span className="tabular-nums">{prev}s</span>}
        </Link>
      ) : (
        <span className="opacity-30 inline-flex items-center gap-1" aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
          {verbose ? "—" : null}
        </span>
      )}
      {next != null ? (
        <Link
          href={`/decade/${next}`}
          aria-label={`Next decade, ${next}s`}
          className="inline-flex items-center gap-1 text-text-secondary hover:text-accent-primary transition-colors"
        >
          {verbose ? `${next}s` : <span className="tabular-nums">{next}s</span>}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="opacity-30 inline-flex items-center gap-1" aria-hidden="true">
          {verbose ? "—" : null}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
