import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageHeader
        title="About"
        subtitle="What this site is, what it isn't, and how to read it honestly."
      />

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What is this?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Sculpture in Data is an interactive data explorer for sculpture
          history — materials, geography, movements, and lineages since 1800.
          It draws on structured public data from Wikidata, with museum APIs
          and Getty ULAN planned for future phases.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Scope &amp; what you&apos;re seeing</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          The published dataset includes <strong>3,600+ sculptors</strong>{" "}
          born since 1800, selected from a broader Wikidata cache of
          ~6,700. A sculptor appears if they satisfy at least one signal:
          a recorded art movement, a documented mentor/student edge,
          curation onto the focus list, multiple citizenships, or
          meaningful non-English Wikipedia reach.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-3">
          The <strong>lineage graph</strong> also includes 680+ non-sculptor
          teachers — painters, composers, architects — who trained
          sculptors but aren&apos;t classified as sculptors themselves in
          Wikidata. They appear as diamond-shaped nodes so cross-media
          academic training isn&apos;t silently dropped.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-3">
          A smaller <strong>curated focus list</strong> (~48 sculptors), assembled
          with the National Sculpture Society, powers the Timeline view
          and drives detail-page highlights. It emphasizes the American
          figurative tradition and is not a comprehensive survey of
          global sculpture.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          This is not an art-historical argument — it&apos;s a lens on
          structured public data. Where the data is incomplete, we say so,
          and the{" "}
          <Link
            href="/transparency"
            className="text-accent-primary hover:underline"
          >
            Transparency page
          </Link>{" "}
          spells out exactly who we include, why, and what biases the rule
          introduces.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Sources</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong className="text-foreground">Current:</strong>
        </p>
        <ul className="space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Wikidata (QLever + WDQS)</strong> —
            Sculptor metadata, movements, citizenships, places of birth/
            death, lineage edges, native-language names, and external
            authority IDs (ULAN, VIAF, LCNAF, BnF, DNB, NDL, BNE)
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong className="text-foreground">Planned:</strong>
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Met Museum API</strong> —
            Object-level data (materials, dates)
          </li>
          <li>
            <strong className="text-foreground">Art Institute of Chicago API</strong> —
            Additional museum data
          </li>
          <li>
            <strong className="text-foreground">Getty ULAN</strong> —
            Enhanced relationship data
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Methodology</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          All data is derived from public databases — no subjective manual scores.
          Every axis comes from Wikidata properties (birth/death dates, movement labels,
          influence/student edges, citizenship, gender). See the{" "}
          <Link
            href="/transparency"
            className="text-accent-primary hover:underline"
          >
            Transparency page
          </Link>{" "}
          for exact counts, inclusion signals, and demographic breakdowns.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Charts that depend on movement labels include coverage caveats, as Wikidata
          movement labels are incomplete and inconsistently applied.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Credits</h2>
        <p className="text-muted-foreground leading-relaxed mb-2">
          <strong className="text-foreground">Built by</strong>{" "}
          <a
            href="https://www.linkedin.com/in/asherzafar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Asher Zafar
          </a>
        </p>
        <p className="text-muted-foreground leading-relaxed mb-2">
          <strong className="text-foreground">Inspired by</strong> Fabio J. Fernández
          and the National Sculpture Society.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Data pipeline in Python, web app in Next.js with D3.js.{" "}
          <a
            href="https://github.com/asherzafar/sculptor-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            View source on GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
