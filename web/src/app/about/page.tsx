export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">About</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What is this?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Sculptor Evolution Explorer is an interactive web app exploring how sculpture
          evolved over time — materials, geography, movements, and lineages — built from
          Wikidata, Met Museum API, and Art Institute of Chicago API data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Sources</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Wikidata (QLever)</strong> —
            Sculptor metadata, movements, citizenships, and relationships
          </li>
          <li>
            <strong className="text-foreground">Met Museum API</strong> —
            Object-level data (materials, dates) — Phase 1
          </li>
          <li>
            <strong className="text-foreground">Art Institute of Chicago API</strong> —
            Additional museum data — Phase 1
          </li>
          <li>
            <strong className="text-foreground">Getty ULAN</strong> —
            Enhanced relationship data — Phase 5
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
        <p className="text-muted-foreground leading-relaxed">
          Built for the National Sculpture Society. Inspired by Fabio J. Fernández.
          Data pipeline in Python, web app in Next.js with Recharts.
        </p>
      </section>
    </div>
  );
}
