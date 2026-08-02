import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { dataSnapshot, formatSnapshotDate } from "@/lib/snapshot";

const formatCount = (value: number) => value.toLocaleString("en-US");

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageHeader
        title="About"
        subtitle="What this site is, what it isn't, and how to read it honestly."
      />

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">What is this?</h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          Sculpture in Data is an interactive data explorer for sculpture
          history — people, geography, movements, institutions, works, and
          recorded lineages since 1800. It is meant for exploration and
          question-forming, not as a complete canon or a substitute for
          art-historical research.
        </p>
        <p className="text-text-secondary leading-relaxed">
          The project began when a friend at the National Sculpture Society
          asked for a graph of artists and their lifespans. That small request
          became an experiment in using AI-assisted development to make art
          data visual, playful, and inspectable.
        </p>
      </section>

      <aside className="mb-8 rounded-md bg-bg-secondary px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-1">
          Data snapshot
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          <strong className="text-text-primary">
            {formatCount(dataSnapshot.includedSculptors)} published sculptors
          </strong>{" "}
          from {formatCount(dataSnapshot.eligibleCandidates)} eligible candidate
          records after evidence-backed exclusions, with{" "}
          {formatCount(dataSnapshot.lineageEdges)} recorded lineage relations.
          Exported {formatSnapshotDate(dataSnapshot.generatedAt)} under
          methodology {dataSnapshot.methodologyVersion}; evidence-backed
          curation last reviewed{" "}
          {formatSnapshotDate(dataSnapshot.curationReviewedAt)}.
        </p>
      </aside>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">Scope &amp; what you&apos;re seeing</h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          The published dataset includes{" "}
          <strong className="text-text-primary">
            {formatCount(dataSnapshot.includedSculptors)} sculptors
          </strong>{" "}
          born since 1800, selected from an analytically eligible candidate
          frame of {formatCount(dataSnapshot.eligibleCandidates)}. The source
          query returned {formatCount(dataSnapshot.sourceCandidates)} records;
          evidence-backed record exclusions are documented on Transparency.
          A sculptor appears if
          they satisfy at least one signal:
          a recorded art movement, a documented mentor/student edge,
          curation onto the focus list, multiple citizenships, or
          meaningful non-English Wikipedia reach.
        </p>
        <p className="text-text-secondary leading-relaxed mb-3">
          The <strong className="text-text-primary">lineage graph</strong> also
          includes {formatCount(dataSnapshot.externalMentors)} non-sculptor
          teachers and influences — painters, composers, architects, and
          others connected to sculptors but not classified as sculptors in
          Wikidata. They appear as diamond-shaped nodes so cross-media
          relationships aren&apos;t silently dropped.
        </p>
        <p className="text-text-secondary leading-relaxed mb-3">
          A smaller <strong className="text-text-primary">curated focus list</strong>{" "}
          ({formatCount(dataSnapshot.focusSculptors)} sculptors), assembled
          with input from the National Sculpture Society, powers the Timeline
          view and drives detail-page highlights. It emphasizes the American
          figurative tradition and is not a comprehensive survey of global
          sculpture.
        </p>
        <p className="text-text-secondary leading-relaxed">
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
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
          Explorer, laboratory, and future scope
        </h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          The public explorer favors interpretable views whose data lineage,
          uncertainty, and limitations can be explained. The repository also
          acts as a laboratory for prototypes — including temporal networks,
          institutional paths, places, and coordinated views — that should
          graduate into the public product only after they answer a clear
          reader question and pass evidence, accessibility, and performance
          gates.
        </p>
        <p className="text-text-secondary leading-relaxed">
          Sculpture is the evidence-building domain, not a permanent technical
          ceiling. The model may expand additively to other artists, places,
          institutions, objects, and periods when source quality supports
          honest comparison; expansion should not flatten every art form into
          one universal ranking or undocumented influence graph.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">
          Data sources &amp; licenses
        </h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          <strong className="text-text-primary">Current:</strong>
        </p>
        <ul className="space-y-2 text-text-secondary mb-4">
          <li>
            <a
              href="https://www.wikidata.org/wiki/Wikidata:Licensing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-primary hover:underline"
            >
              Wikidata (CC0; QLever + WDQS)
            </a>{" "}
            —
            Sculptor metadata, movements, citizenships, places of birth/
            death, lineage edges, native-language names, and external
            authority IDs (ULAN, VIAF, LCNAF, BnF, DNB, NDL, BNE)
          </li>
          <li>
            <a
              href="https://www.getty.edu/research/tools/vocabularies/ulan/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-primary hover:underline"
            >
              Getty ULAN (ODC Attribution 1.0)
            </a>{" "}
            —
            Cross-source audit and selected biographical verification; Getty
            evidence is shown alongside Wikidata rather than silently
            replacing it
          </li>
          <li>
            <a
              href="https://www.metmuseum.org/about-the-met/policies-and-documents/open-access"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-primary hover:underline"
            >
              Metropolitan Museum of Art Open Access
            </a>{" "}
            and{" "}
            <a
              href="https://www.artic.edu/open-access/open-access-images"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-primary hover:underline"
            >
              Art Institute of Chicago Open Access
            </a>{" "}
            —
            Public-domain object images and work metadata for the curated focus
            subset where available
          </li>
          <li>
            <a
              href="https://commons.wikimedia.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-primary hover:underline"
            >
              Wikimedia Commons (file-specific licenses)
            </a>{" "}
            —
            Portraits linked through Wikidata, with readers directed to the
            Commons file page for licensing and attribution
          </li>
        </ul>
        <p className="text-sm text-text-secondary leading-relaxed">
          Contains information from the Union List of Artist Names (ULAN)®,
          made available under the{" "}
          <a
            href="https://opendatacommons.org/licenses/by/1-0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Open Data Commons Attribution License
          </a>
          . The combined export has mixed provenance; source-specific terms
          and object/file attribution still apply.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">Methodology</h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          Most displayed fields are derived from public databases, and the
          inclusion rule is versioned rather than scored subjectively. A small
          set of focus-list choices and evidence-backed corrections or
          exclusions is maintained explicitly so curation is visible instead
          of being disguised as raw source data. See the{" "}
          <Link
            href="/transparency"
            className="text-accent-primary hover:underline"
          >
            Transparency page
          </Link>{" "}
          for exact counts, inclusion signals, and demographic breakdowns.
        </p>
        <p className="text-text-secondary leading-relaxed mb-3">
          Gender, citizenship, nationality/culture, movement, and relationship
          values are attributed source assertions. The project does not infer
          missing identities, treat citizenship as culture, or treat a recorded
          relationship or graph path as proof of causal influence.
        </p>
        <p className="text-text-secondary leading-relaxed">
          Read the maintained{" "}
          <a
            href="https://github.com/asherzafar/sculptor-explorer/blob/main/docs/DATASET_DATASHEET.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            dataset datasheet
          </a>{" "}
          for composition, licenses, processing, missingness, intended and
          non-intended uses, risks, citation, and maintenance. The{" "}
          <a
            href="https://github.com/asherzafar/sculptor-explorer/blob/main/docs/CLAIM_REGISTER.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            public claim register
          </a>{" "}
          records the evidence and language boundary for each analytical view.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-3">Credits</h2>
        <p className="text-text-secondary leading-relaxed mb-2">
          <strong className="text-text-primary">Built by</strong>{" "}
          <a
            href="https://www.linkedin.com/in/asherzafar/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Asher Zafar
          </a>
        </p>
        <p className="text-text-secondary leading-relaxed mb-2">
          <strong className="text-text-primary">Inspired by</strong> Fabio J. Fernández
          and the National Sculpture Society.
        </p>
        <p className="text-text-secondary leading-relaxed">
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
