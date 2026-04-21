"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadTransparency } from "@/lib/data";
import type { TransparencyAudit } from "@/lib/types";

/**
 * Transparency page — Option A.3 standing commitment.
 *
 * Shows honest base rates:
 *  - How many sculptors are cached vs published
 *  - Why each sculptor qualified (signal coverage)
 *  - Demographic breakdown of both the included AND excluded sets so
 *    the reader can see what biases the rule introduces
 *
 * Pure table/list rendering — no charts — to keep the page legible
 * and robust. Data comes from /data/transparency.json which is
 * regenerated every pipeline run.
 */

const SIGNAL_LABELS: Record<string, string> = {
  movement: "Art movement listed",
  edge: "Lineage connection",
  focus: "Curated focus list",
  multi_citz: "Multiple citizenships",
  sitelinks: "Wikipedia reach (≥3 non-English articles)",
};

function formatPct(n: number, total: number): string {
  if (!total) return "0.0%";
  return `${((100 * n) / total).toFixed(1)}%`;
}

interface BreakdownProps {
  title: string;
  data: TransparencyAudit["includedBreakdown"];
  accent: "primary" | "muted";
}

function Breakdown({ title, data, accent }: BreakdownProps) {
  const { total, gender, topCitizenships, byBirthDecade } = data;
  const accentText =
    accent === "primary" ? "text-accent-primary" : "text-text-secondary";
  const barColor = accent === "primary" ? "bg-accent-primary" : "bg-text-tertiary/60";

  return (
    <section className="rounded-md border border-border bg-bg-secondary/50 p-5">
      <header className="mb-4">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${accentText}`}>
          {title}
        </h3>
        <p className="text-2xl font-display font-semibold text-text-primary mt-0.5">
          {total.toLocaleString()}
        </p>
      </header>

      {gender && Object.keys(gender).length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-tertiary mb-1.5">Gender</p>
          <ul className="space-y-0.5 text-sm text-text-secondary">
            {Object.entries(gender)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span className="capitalize">{k}</span>
                  <span className="tabular-nums text-text-tertiary">
                    {v.toLocaleString()} · {formatPct(v, total)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {topCitizenships && Object.keys(topCitizenships).length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-text-tertiary mb-1.5">Top citizenships</p>
          <ul className="space-y-0.5 text-sm text-text-secondary">
            {Object.entries(topCitizenships)
              .slice(0, 10)
              .map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span className="tabular-nums text-text-tertiary">
                    {v.toLocaleString()} · {formatPct(v, total)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {byBirthDecade && Object.keys(byBirthDecade).length > 0 && (
        <div>
          <p className="text-xs text-text-tertiary mb-1.5">Births by decade</p>
          <div className="space-y-1">
            {Object.entries(byBirthDecade)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([decade, count]) => {
                const pct = (100 * count) / total;
                return (
                  <div
                    key={decade}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <span className="w-10 tabular-nums text-text-tertiary">
                      {decade}s
                    </span>
                    <div className="flex-1 h-2 bg-bg-primary rounded-sm overflow-hidden">
                      <div
                        className={`h-full ${barColor}`}
                        style={{ width: `${Math.min(100, pct * 4)}%` }}
                      />
                    </div>
                    <span className="w-14 tabular-nums text-text-tertiary text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
}

export default function TransparencyPage() {
  const [audit, setAudit] = useState<TransparencyAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setAudit(await loadTransparency());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-text-secondary">Loading transparency audit…</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-text-secondary">
          Could not load transparency audit: {error}
        </p>
      </div>
    );
  }

  const generated = new Date(audit.generatedAt).toLocaleString();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/about"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        About
      </Link>

      <h1 className="font-display text-3xl font-bold text-text-primary mt-8 mb-2">
        Transparency Audit
      </h1>
      <p className="text-text-secondary mb-6 leading-relaxed">
        Every figure you see elsewhere on this site is drawn from the{" "}
        <strong>Included</strong> subset below. This page shows which
        sculptors we publish, why, and how that choice affects
        representation. Regenerated on every pipeline run.
      </p>
      <p className="text-xs text-text-tertiary mb-10">
        Snapshot generated {generated}.
      </p>

      {/* Top-line counts */}
      <section className="mb-10 grid grid-cols-3 gap-4">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Cached from Wikidata
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {audit.totalCached.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            sculptor QIDs born ≥ 1800
          </p>
        </div>
        <div className="rounded-md border border-accent-primary/30 bg-accent-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-accent-primary">
            Included (published)
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {audit.included.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {audit.inclusionPctOfCache}% of cache
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Excluded
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {audit.excluded.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            held back for signal gaps
          </p>
        </div>
      </section>

      {/* Inclusion rule */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-3">
          Inclusion rule (version {audit.criterion.version})
        </h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          {audit.criterion.rule}
        </p>
        <ul className="text-sm text-text-secondary space-y-1 mb-4">
          <li>
            <span className="text-text-tertiary">Authority IDs gate?</span>{" "}
            {audit.criterion.authorityIdsAsGate ? "Yes" : "No"} — ULAN/VIAF/
            LCNAF identifiers appear as metadata but do not gate inclusion.
          </li>
          <li>
            <span className="text-text-tertiary">Non-English sitelink threshold:</span>{" "}
            ≥ {audit.criterion.sitelinkMinNonEnglish}
          </li>
          <li>
            <span className="text-text-tertiary">Bot-dominated wikis excluded:</span>{" "}
            {audit.criterion.botWikisExcluded.map((w) => (
              <code
                key={w}
                className="ml-1 text-xs bg-bg-secondary rounded px-1 py-0.5"
              >
                {w}
              </code>
            ))}
          </li>
        </ul>

        <h3 className="text-sm font-semibold text-text-primary mb-2">
          How often each signal fired
        </h3>
        <ul className="space-y-1.5 text-sm text-text-secondary">
          {Object.entries(audit.signalCoverage)
            .sort(([, a], [, b]) => b - a)
            .map(([signal, count]) => {
              const pct = (100 * count) / audit.totalCached;
              return (
                <li key={signal} className="flex items-center gap-3">
                  <span className="w-56 shrink-0">
                    {SIGNAL_LABELS[signal] ?? signal}
                  </span>
                  <div className="flex-1 h-2 bg-bg-secondary rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-accent-primary"
                      style={{ width: `${Math.min(100, pct * 2)}%` }}
                    />
                  </div>
                  <span className="w-32 text-right tabular-nums text-text-tertiary">
                    {count.toLocaleString()} · {pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
        </ul>
        <p className="text-xs text-text-tertiary mt-3">
          Sculptors can fire multiple signals — percentages do not sum to 100%.
        </p>
      </section>

      {/* Demographic breakdowns */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-3">
          Demographic breakdown
        </h2>
        <p className="text-text-secondary mb-5">
          Comparing the published set against what we held back. Any gap here
          is a bias the rule introduces; the point is to show it, not hide it.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <Breakdown
            title="Included"
            data={audit.includedBreakdown}
            accent="primary"
          />
          <Breakdown
            title="Excluded"
            data={audit.excludedBreakdown}
            accent="muted"
          />
        </div>
      </section>

      <section className="text-sm text-text-tertiary">
        <p>
          This page is a standing commitment: it regenerates automatically
          from the pipeline so the figures above always match the published
          data exactly.
        </p>
      </section>
    </div>
  );
}
