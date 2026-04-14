export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-text-primary mb-6">About</h1>

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
        <h2 className="text-xl font-semibold mb-3">Curation &amp; Scope</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          The curated sculptor list was developed with the National Sculpture
          Society and emphasizes the American figurative tradition. It is not a
          comprehensive survey of global sculpture. Both the curated list and
          the broader Wikidata dataset have gaps in movement labels,
          relationship edges, and non-Western representation.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          This is not an art-historical argument — it&apos;s a lens on
          structured public data. Where the data is incomplete, we say so.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Sources</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong className="text-foreground">Current:</strong>
        </p>
        <ul className="space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Wikidata (QLever)</strong> —
            Sculptor metadata, movements, citizenships, and relationships
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
          influence/student edges, citizenship, gender).
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
