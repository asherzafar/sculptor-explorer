"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadMovements } from "@/lib/data";
import type { MovementsData, MovementStats } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { NotableSculptorCard } from "@/components/NotableSculptorCard";
import { formatDisplayValue } from "@/lib/utils";

/**
 * MovementView — renders one /movement/[slug] page.
 *
 * Mirrors the decade-page layout (headline → stat blocks → simple
 * sub-charts → notable roster) so the two destination pages feel like
 * variations on a theme rather than two different products. The "go to
 * /decade/[peak]" link in the header invites cross-navigation.
 */
export function MovementView({ slug }: { slug: string }) {
  const [data, setData] = useState<MovementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMovements().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const movement: MovementStats | undefined = data?.movements?.[slug];

  // Surface a few related movements (by raw sculptor count overlap is
  // out of scope for v1; here we just show the closest peers in
  // chronology — same peak decade or adjacent — to give the page
  // somewhere to send the reader next).
  const peers = useMemo(() => {
    if (!data || !movement) return [];
    const peak = movement.peakDecade;
    if (peak == null) return [];
    return data.index
      .filter(
        (e) =>
          e.slug !== movement.slug &&
          e.peakDecade != null &&
          Math.abs((e.peakDecade ?? 0) - peak) <= 10
      )
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [data, movement]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState label="Loading movement data" />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          eyebrow={
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Explore
            </Link>
          }
          title={slug}
        />
        <EmptyState
          variant="block"
          title="Movement not found"
          description={`No movement page exists for "${slug}". Movements with fewer than 3 sculptors don't get a dedicated page; check the URL or use the search on /explore.`}
        />
      </div>
    );
  }

  const displayName = formatDisplayValue(movement.name, { isMovement: true });

  // Compact span line for the subtitle ("born 1880–1942, peak 1900s").
  const spanParts: string[] = [];
  if (movement.yearsMin && movement.yearsMax) {
    spanParts.push(`born ${movement.yearsMin}–${movement.yearsMax}`);
  }
  if (movement.peakDecade != null) {
    spanParts.push(`peak ${movement.peakDecade}s`);
  }
  const span = spanParts.join(" · ");

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        eyebrow={
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 hover:text-accent-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Explore
          </Link>
        }
        title={displayName}
        subtitle={
          <>
            {movement.total} sculptors associated with this movement
            {span ? ` · ${span}` : ""}.
          </>
        }
        actions={
          movement.peakDecade != null ? (
            <Link
              href={`/decade/${movement.peakDecade}`}
              className="text-sm text-accent-primary hover:text-accent-hover transition-colors"
            >
              Visit the {movement.peakDecade}s →
            </Link>
          ) : null
        }
      />

      {/* Headline grid */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <StatBlock
          label="Sculptors associated"
          value={movement.total.toLocaleString()}
          sub={
            movement.yearsMedian
              ? `Median birth year ${movement.yearsMedian}`
              : undefined
          }
          accent
        />
        <StatBlock
          label="Birth-year range"
          value={
            movement.yearsMin && movement.yearsMax
              ? `${movement.yearsMin}–${movement.yearsMax}`
              : "—"
          }
          sub={
            movement.yearsMin && movement.yearsMax
              ? `${movement.yearsMax - movement.yearsMin} years between earliest and latest`
              : undefined
          }
        />
        <StatBlock
          label="Top country of birth"
          value={movement.topCountries[0]?.country ?? "—"}
          sub={
            movement.topCountries[0]
              ? `${movement.topCountries[0].count} of ${movement.total} sculptors`
              : undefined
          }
        />
      </div>

      {/* Two-column: birth-decade histogram + countries */}
      <div className="grid gap-8 md:grid-cols-2 mb-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Sculptors by birth decade
          </h2>
          <DecadeHistogram items={movement.byDecade} />
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Countries of birth
          </h2>
          {movement.topCountries.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No birth-country data on record.
            </p>
          ) : (
            <ul className="space-y-2">
              {movement.topCountries.map((c) => {
                const pct = Math.round((c.count / movement.total) * 100);
                const maxCount = Math.max(
                  ...movement.topCountries.map((x) => x.count),
                  1
                );
                return (
                  <li key={c.country} className="text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-text-primary truncate">
                        {c.country}
                      </span>
                      <span className="text-text-tertiary tabular-nums shrink-0">
                        {c.count} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-accent-primary"
                        style={{
                          width: `${(c.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Notable sculptors */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Notable sculptors
          </h2>
          <span className="text-sm text-text-tertiary">
            Top {movement.notable.length} by lineage connections
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {movement.notable.map((s) => (
            <NotableSculptorCard
              key={s.qid}
              sculptor={s}
              hideMovement
            />
          ))}
        </div>
      </section>

      {/* Related movements (chronological peers) */}
      {peers.length > 0 && (
        <section className="pt-6 border-t border-border-subtle">
          <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
            Movements with overlapping eras
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Other movements whose sculptors peak within a decade of this
            one&apos;s {movement.peakDecade}s peak. Useful for tracing
            the transitions between styles, though the data is
            association by Wikidata label, not curatorial inheritance.
          </p>
          <div className="flex flex-wrap gap-2">
            {peers.map((p) => (
              <Link
                key={p.slug}
                href={`/movement/${p.slug}`}
                className="text-sm px-3 py-1.5 rounded-full bg-bg-secondary hover:bg-accent-muted text-text-secondary hover:text-accent-primary transition-colors"
              >
                {formatDisplayValue(p.name, { isMovement: true })}
                <span className="ml-2 text-text-tertiary tabular-nums">
                  {p.total}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── small components, page-local ────────────────────────────────────────

function StatBlock({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-bg-secondary p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-semibold tabular-nums leading-tight ${
          accent ? "text-accent-primary" : "text-text-primary"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-text-secondary leading-snug">
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * DecadeHistogram — minimal CSS-only bar chart for a movement's birth
 * decade distribution. Why not D3: this is a 10-bar chart with no axes
 * and no interaction. Pulling D3 in would be ceremony for no benefit.
 */
function DecadeHistogram({
  items,
}: {
  items: Array<{ decade: number; count: number }>;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">No decade data on record.</p>
    );
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-center">
      {items.map((item) => {
        const pct = (item.count / max) * 100;
        return (
          <li key={item.decade} className="contents">
            <Link
              href={`/decade/${item.decade}`}
              className="text-xs text-text-tertiary hover:text-accent-primary tabular-nums transition-colors"
            >
              {item.decade}s
            </Link>
            <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
              <div
                className="h-full bg-accent-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary tabular-nums">
              {item.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
