"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  loadCrossCulturalSummary,
  loadGettyAudit,
  loadTransparency,
} from "@/lib/data";
import type {
  CrossCulturalSummary,
  GettyAudit,
  TransparencyAudit,
} from "@/lib/types";

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

/**
 * CrossCulturalCollaboration — Phase 4 migration-story surface.
 *
 * Shows what fraction of mentor-student / influence edges cross
 * national borders, by decade. Designed to read alongside the
 * Option A.3 inclusion audit: same numerical-tabular style, same
 * commitment to disclosing the messy edges.
 *
 * Caveats surfaced inline rather than buried:
 *   - Tri-state denominator: external-mentor edges (no citizenship
 *     data) are excluded from both numerator and denominator.
 *   - Historical-state name drift: pairs like "Germany ↔ Kingdom of
 *     Prussia" or "German Reich ↔ Germany" describe the same place
 *     under different historical names; we show them honestly rather
 *     than collapsing them, with a note explaining why.
 */
function CrossCulturalCollaboration({
  summary,
}: {
  summary: CrossCulturalSummary;
}) {
  const headlinePct =
    summary.crossPctOfComparable !== null
      ? `${(100 * summary.crossPctOfComparable).toFixed(1)}%`
      : "—";

  // Decade buckets with low N (< 5 comparable edges) are noisy — we
  // still render them but render the bar at lower opacity so the
  // reader sees the data sparsity at a glance. This is the same
  // pattern as the inclusion-signal coverage section above.
  const maxDecadeTotal = Math.max(
    1,
    ...summary.byDecade.map((b) => b.total),
  );

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-text-primary mb-3">
        Cross-cultural collaboration
      </h2>
      <p className="text-text-secondary leading-relaxed mb-4 max-w-3xl">
        How many lineage connections cross national borders? An édge
        crosses borders when its two endpoints share no citizenship —
        the émigré who studied abroad, the refugee who carried a
        tradition with them, the student who travelled to a famous
        atelier. The denominator below excludes edges to external
        mentors (the diamonds on{" "}
        <Link href="/lineage" className="text-accent-primary hover:underline">
          /lineage
        </Link>
        ), since we don&apos;t fetch citizenship for non-sculptor
        teachers.
      </p>

      {/* Headline */}
      <section className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-md border border-accent-primary/30 bg-accent-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-accent-primary">
            Cross-border rate
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {headlinePct}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            of {summary.comparable.toLocaleString()} classifiable edges
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Cross-border edges
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {summary.crossBorder.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            émigré / international training
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Same-nationality edges
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {summary.sameNationality.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            within a single country
          </p>
        </div>
      </section>

      {/* By decade — the migration story is fundamentally a temporal
          one, so the decade chart is the centrepiece. */}
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        By teacher / influencer&apos;s birth decade
      </h3>
      <ul className="space-y-1.5 mb-3">
        {summary.byDecade.map((b) => {
          const pct = b.total ? (100 * b.cross) / b.total : 0;
          const sparse = b.total < 5;
          return (
            <li
              key={b.decade}
              className={`flex items-center gap-3 text-sm ${
                sparse ? "opacity-60" : ""
              }`}
              title={
                sparse
                  ? `Sparse decade — only ${b.total} classifiable edges`
                  : undefined
              }
            >
              <span className="w-16 shrink-0 text-text-secondary tabular-nums">
                {b.decade}s
              </span>
              <div className="relative flex-1 h-3 bg-bg-secondary rounded-sm overflow-hidden">
                {/* Stacked bar: cross-border on top of same-nationality
                    base. Width of the base reflects total volume of
                    edges in that decade so the reader can see both
                    rate and sample size at once. */}
                <div
                  className="absolute inset-y-0 left-0 bg-text-tertiary/40"
                  style={{
                    width: `${(100 * b.total) / maxDecadeTotal}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-accent-primary"
                  style={{
                    width: `${
                      ((100 * b.cross) / maxDecadeTotal)
                    }%`,
                  }}
                />
              </div>
              <span className="w-32 text-right tabular-nums text-text-tertiary text-xs">
                {b.cross}/{b.total} · {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-text-tertiary mb-5 max-w-3xl">
        Faded rows have fewer than 5 comparable edges and are noisy. The
        narrow bar shows total volume of classifiable connections; the
        accent-coloured slice shows the cross-border share. The mid-19th
        century peaks reflect the era of European cross-pollination —
        Paris and Rome as cosmopolitan training grounds.
      </p>

      {/* Top country pairs */}
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Most-common country pairs
      </h3>
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm max-w-2xl">
          <thead className="text-text-tertiary text-xs">
            <tr>
              <th className="text-left font-medium px-2 py-1.5">From</th>
              <th className="text-left font-medium px-2 py-1.5">To</th>
              <th className="text-right font-medium px-2 py-1.5">Edges</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {summary.topPairs.map((p, i) => (
              <tr
                key={`${p.a}-${p.b}`}
                className={i % 2 === 0 ? "bg-bg-secondary/40" : ""}
              >
                <td className="px-2 py-1.5">{p.a}</td>
                <td className="px-2 py-1.5">{p.b}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {p.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-tertiary max-w-3xl">
        <strong className="text-text-secondary">Caveat — historical states.</strong>{" "}
        Wikidata records citizenship as the country that existed at the
        sculptor&apos;s lifetime, so pairs like &ldquo;Germany ↔
        Kingdom of Prussia&rdquo; or &ldquo;German Reich ↔ Germany&rdquo;
        describe the same physical place under different historical
        names. We&apos;re showing them honestly rather than silently
        collapsing them; tracked as a parking-lot item for a future data
        pass.
      </p>
    </section>
  );
}

/**
 * GettyCrossReference — renders Phase 3b's Wikidata ↔ Getty audit.
 *
 * Layout choice: keep it numerical and tabular like the rest of the
 * transparency page. The point of cross-referencing two sources isn't
 * to declare a winner; it's to disclose where they agree, where they
 * disagree, and where one fills a gap in the other.
 */
function GettyCrossReference({ audit }: { audit: GettyAudit }) {
  const a = audit.aggregate;
  const totalCompared = a.compared || 1; // guard /0

  const pct = (n: number, total: number) =>
    total ? `${((100 * n) / total).toFixed(1)}%` : "—";

  // Tiny inline bar — same vocabulary as the existing signal-coverage
  // section so the page reads as one document.
  function Bar({
    label,
    n,
    total,
    color = "bg-accent-primary",
  }: {
    label: string;
    n: number;
    total: number;
    color?: string;
  }) {
    return (
      <li className="flex items-center gap-3 text-sm">
        <span className="w-44 shrink-0 text-text-secondary">{label}</span>
        <div className="flex-1 h-2 bg-bg-secondary rounded-sm overflow-hidden">
          <div
            className={`h-full ${color}`}
            style={{
              width: `${total ? Math.min(100, (100 * n) / total) : 0}%`,
            }}
          />
        </div>
        <span className="w-32 text-right tabular-nums text-text-tertiary">
          {n.toLocaleString()} · {pct(n, total)}
        </span>
      </li>
    );
  }

  function SampleTable({
    title,
    rows,
    columns,
  }: {
    title: string;
    rows: Array<Record<string, unknown>>;
    columns: { key: string; label: string }[];
  }) {
    if (rows.length === 0) return null;
    const stringify = (v: unknown): string => {
      if (v == null) return "—";
      if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
      return String(v);
    };
    return (
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-text-primary mb-2">
          {title}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="text-left font-medium px-2 py-1.5"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-bg-secondary/40" : ""}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-2 py-1.5 align-top">
                      {stringify(r[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-text-primary mb-3">
        Cross-reference: Getty ULAN
      </h2>
      <p className="text-text-secondary leading-relaxed mb-4 max-w-3xl">
        Where Wikidata records a Getty ULAN identifier we fetch the parallel
        Getty record and compare. The two sources model some things
        differently — Getty&apos;s &ldquo;nationality&rdquo; is cultural
        attribution, Wikidata&apos;s <code className="text-xs">citizenships[]</code>{" "}
        is legal citizenship — so disagreement is information, not a
        defect. Numbers below are honest base rates, no smoothing.
      </p>

      {/* Headline */}
      <section className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Records compared
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {a.compared.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            sculptors with a ULAN ID
          </p>
        </div>
        <div className="rounded-md border border-accent-primary/30 bg-accent-muted/20 p-4">
          <p className="text-xs uppercase tracking-wide text-accent-primary">
            Birth-year exact match
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {pct(a.birth_year.exact_match, a.birth_year.comparable)}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {a.birth_year.exact_match.toLocaleString()} of{" "}
            {a.birth_year.comparable.toLocaleString()} comparable
          </p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">
            Birthplace gaps Getty fills
          </p>
          <p className="font-display text-3xl font-semibold text-text-primary mt-1">
            {a.birth_place.getty_fills_wd_gap.toLocaleString()}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            sculptors where Wikidata had nothing
          </p>
        </div>
      </section>

      {/* Year accuracy */}
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Year accuracy (across {a.compared.toLocaleString()} records)
      </h3>
      <ul className="space-y-1.5 mb-5">
        <Bar
          label="Birth year exact match"
          n={a.birth_year.exact_match}
          total={totalCompared}
          color="bg-accent-primary"
        />
        <Bar
          label="Birth year off by 1"
          n={a.birth_year.off_by_1}
          total={totalCompared}
          color="bg-accent-primary/60"
        />
        <Bar
          label="Birth year off by 2+"
          n={a.birth_year.off_by_more}
          total={totalCompared}
          color="bg-text-tertiary/60"
        />
        <Bar
          label="Death year exact match"
          n={a.death_year.exact_match}
          total={totalCompared}
          color="bg-accent-primary"
        />
        <Bar
          label="Death year off by 1"
          n={a.death_year.off_by_1}
          total={totalCompared}
          color="bg-accent-primary/60"
        />
        <Bar
          label="Death year off by 2+"
          n={a.death_year.off_by_more}
          total={totalCompared}
          color="bg-text-tertiary/60"
        />
      </ul>

      {/* Place coverage + agreement */}
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Place coverage and agreement
      </h3>
      <ul className="space-y-1.5 mb-2">
        <Bar
          label="Both have birthplace"
          n={a.birth_place.both_present}
          total={totalCompared}
          color="bg-accent-primary"
        />
        <Bar
          label="Getty fills Wikidata gap"
          n={a.birth_place.getty_fills_wd_gap}
          total={totalCompared}
          color="bg-accent-primary/60"
        />
        <Bar
          label="Wikidata fills Getty gap"
          n={a.birth_place.wd_fills_getty_gap}
          total={totalCompared}
          color="bg-text-tertiary/60"
        />
      </ul>
      <p className="text-xs text-text-tertiary mb-5">
        Birthplace agreement (when both present):{" "}
        <strong className="text-text-secondary">
          {a.birth_place.agreement_rate != null
            ? `${(100 * a.birth_place.agreement_rate).toFixed(1)}%`
            : "—"}
        </strong>{" "}
        · Death-place agreement:{" "}
        <strong className="text-text-secondary">
          {a.death_place.agreement_rate != null
            ? `${(100 * a.death_place.agreement_rate).toFixed(1)}%`
            : "—"}
        </strong>
        . &ldquo;Agreement&rdquo; means one source&apos;s place name appears
        as a substring of the other&apos;s; this catches city-vs-country
        differences but treats &ldquo;Kyiv&rdquo; and &ldquo;Russian
        Empire&rdquo; as a disagreement even when they describe the same
        person.
      </p>

      {/* Nationality */}
      <h3 className="text-sm font-semibold text-text-primary mb-2">
        Nationality / citizenship overlap
      </h3>
      <ul className="space-y-1.5 mb-2">
        <Bar
          label="Full agreement"
          n={a.nationality.full_agreement}
          total={a.nationality.comparable}
          color="bg-accent-primary"
        />
        <Bar
          label="Some overlap"
          n={a.nationality.any_overlap - a.nationality.full_agreement}
          total={a.nationality.comparable}
          color="bg-accent-primary/60"
        />
        <Bar
          label="No overlap"
          n={a.nationality.no_overlap}
          total={a.nationality.comparable}
          color="bg-text-tertiary/60"
        />
      </ul>
      <p className="text-xs text-text-tertiary mb-5">
        Mean Jaccard similarity:{" "}
        <strong className="text-text-secondary">
          {a.nationality.mean_jaccard != null
            ? a.nationality.mean_jaccard.toFixed(2)
            : "—"}
        </strong>
        . Getty introduces a country Wikidata doesn&apos;t have for{" "}
        {a.nationality.getty_adds_country.toLocaleString()} sculptors;
        Wikidata returns the favour for{" "}
        {a.nationality.wd_adds_country.toLocaleString()}.
      </p>

      {/* Spot-check tables */}
      <details className="mb-2">
        <summary className="cursor-pointer text-sm text-accent-primary hover:underline mb-2">
          Spot-check disagreements
        </summary>
        <div className="mt-3">
          <SampleTable
            title="Birth year disagreements (off by 2+)"
            rows={audit.samples.birth_year_off_by_more}
            columns={[
              { key: "name", label: "Sculptor" },
              { key: "wd_birth_year", label: "Wikidata" },
              { key: "getty_birth_year", label: "Getty" },
            ]}
          />
          <SampleTable
            title="Birthplace disagreements (both sources have data)"
            rows={audit.samples.birth_place_disagree}
            columns={[
              { key: "name", label: "Sculptor" },
              { key: "wd_birth_city", label: "Wikidata city" },
              { key: "wd_birth_country", label: "Wikidata country" },
              { key: "getty_birth_place", label: "Getty place" },
            ]}
          />
          <SampleTable
            title="Birthplaces Getty fills (Wikidata had nothing)"
            rows={audit.samples.getty_fills_birthplace_gap}
            columns={[
              { key: "name", label: "Sculptor" },
              { key: "getty_birth_place", label: "Getty place" },
            ]}
          />
          <SampleTable
            title="Nationality with no overlap"
            rows={audit.samples.nationality_no_overlap}
            columns={[
              { key: "name", label: "Sculptor" },
              { key: "wd_citizenships", label: "Wikidata" },
              { key: "getty_nationalities", label: "Getty" },
            ]}
          />
        </div>
      </details>
    </section>
  );
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
  const [getty, setGetty] = useState<GettyAudit | null>(null);
  const [crossCultural, setCrossCultural] =
    useState<CrossCulturalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [a, g, cc] = await Promise.all([
          loadTransparency(),
          loadGettyAudit(),
          loadCrossCulturalSummary(),
        ]);
        setAudit(a);
        setGetty(g);
        setCrossCultural(cc);
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

      {/* Phase 3b — Wikidata ↔ Getty cross-reference. Renders only when
          getty_audit.json is present (the file is generated by
          pipeline/audit_getty.py and is therefore optional during
          early development / first runs). */}
      {/* Phase 4 — cross-cultural collaboration. Renders only when
          cross_cultural_summary.json is present (generated by
          export_json.py). */}
      {crossCultural && <CrossCulturalCollaboration summary={crossCultural} />}

      {getty && <GettyCrossReference audit={getty} />}

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
