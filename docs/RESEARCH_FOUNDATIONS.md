# Research Foundations and Practice Standards

**Last reviewed:** 2026-08-02

This document turns external evidence into repository practice. It is not a reading list for its own sake: each source below has a concrete implication, a place where the implication is encoded, and a way to verify it.

## Evidence hierarchy

Prefer, in order:

1. Standards bodies and primary source-system documentation.
2. Peer-reviewed research and established scholarly books.
3. Official framework/vendor documentation.
4. Reputable practitioner synthesis, clearly labeled as guidance rather than proof.
5. Local measurement and user evidence, which decide whether a general practice fits this product.

Record the retrieval/review date for volatile web guidance. Do not use an AI summary as the citation when the primary source is available.

## Visualization and interaction

| Foundation | Practice in this project | Verification |
|---|---|---|
| Munzner’s nested model separates domain problem, data/task abstraction, visual encoding/interaction, and algorithm. | Every large visualization proposal states all four levels. Validate the outer level before optimizing an inner one. | Proposal has a reader question, data/task model, idiom rationale, and performance/data tests. |
| Shneiderman’s visual-information-seeking mantra: overview first, zoom/filter, then details on demand. | Default routes are intelligible overviews; dense nodes and advanced dimensions are opt-in; entity detail is one action away. | A first-time task test succeeds without instructions; focused states remain URL-shareable. |
| Empirical graphical-perception work shows that position/length generally support more accurate judgments than area, angle, and color. | Use position or length for quantitative comparison when accuracy matters. Use color primarily for grouping/state, with a second channel. | Design review asks what comparison the reader must make and whether the encoding supports it. |
| Uncertainty-visualization research warns that omission creates false precision and that uncertainty displays must match the task. | Temporal envelopes, confidence, missingness, and sample size appear near the mark or claim they qualify. | No derived edge or narrative claim silently collapses an interval/unknown into a precise fact. |

## Human-centered UX and cultural-collection browsing

| Foundation | Practice in this project | Verification |
|---|---|---|
| ISO 9241-210 treats human-centered design as an iterative cycle of understanding context, specifying requirements, producing alternatives, and evaluating with users. | Phase 5Q reviews begin with route tasks and reader contexts, compare alternatives before broad restyling, and revisit requirements after observed use. | Each route slice records the target task, baseline problem, alternatives considered, evaluation evidence, and decision. |
| Information-foraging theory focuses on information scent and the cost of moving between patches of information. | Entity labels, navigation, search, and “what next” links should make likely destinations clear before a reader commits. Dead-end chips and ambiguous graph interactions are defects. | Find/share tasks record wrong turns and time to a useful destination; link labels predict the destination content. |
| Whitelaw’s “generous interfaces” argues that cultural collections should reveal their scope and texture before demanding a precise query. | Pair search with browsable overviews, representative entry points, and visible collection shape. Do not make a first-time visitor know an artist name or database vocabulary before seeing anything meaningful. | First-visit tests compare search-first and overview-first paths; curated entry points remain evidence-reviewed, URL-backed states. |
| Drucker’s humanities approach warns against presenting interpretation, ambiguity, and incomplete evidence as objective graphical fact. | Preserve source attribution, uncertainty, and contestability in visual language. A layout, cluster, or smooth curve must not make an interpretive claim look inevitable. | Claim review asks what the visual form implies beyond the data contract and adds uncertainty, alternative views, or reframing where needed. |

## Layout, typography, and visual hierarchy

Typography has two evidence layers here. Bringhurst is an expert craft source
for rhythm, measure, hierarchy, and typographic detail; WCAG reflow, zoom, text
spacing, contrast, and user testing are the acceptance evidence for the web.
The book is not treated as proof that one fixed measure or type scale works for
every reader or screen.

- Evaluate Fraunces and DM Sans with a repository type specimen containing
  long and short artist names, diacritics and non-Latin forms, dates, axes,
  dense table rows, caveats, and mobile headings—not with lorem ipsum.
- Audit hierarchy by task: what must be noticed first, what supports it, what
  is metadata, and what may be progressively disclosed. Decorative scale is
  not a substitute for a clear information hierarchy.
- Test reading measure, line height, tabular figures, weight, and optical size
  at 320/390/768/1024/1440 CSS pixels, 200% zoom, and WCAG text-spacing
  overrides. No required content or control may clip or overlap.
- Keep display/body roles stable unless the specimen and reader tests show a
  problem. A new typeface is a product-identity decision, not a local patch.

## Color and perceptual design

| Foundation | Practice in this project | Verification |
|---|---|---|
| ColorBrewer formalized task-aware sequential, diverging, and qualitative schemes with color-vision and reproduction constraints. | Classify every scale by data semantics before choosing colors; do not use an ordered ramp for nominal categories or a rainbow for convenience. | The encoding inventory names scale type, ordering, background, and secondary channel for every use of color. |
| Crameri, Shephard, and Heron show how non-uniform and rainbow-like maps create false boundaries and hide structure. | Use perceptually ordered ramps for magnitude and inspect interpolation in a perceptual color space such as OKLCH. Keep the material palette for identity while deriving chart scales deliberately. | Test grayscale, common color-vision simulations, light/dark contexts, and whether equal data steps create roughly equal perceptual steps. |
| WCAG 2.2 provides the current normative contrast and non-color requirements. Emerging APCA/WCAG 3 methods may be useful diagnostics but are not the release acceptance standard while still draft. | Text and essential UI pass WCAG 2.2 AA; chart state never depends on color alone. Experimental contrast metrics may flag cases for human review, not replace the normative gate. | Automated contrast checks are followed by visual inspection, forced-colors/high-contrast checks, and task testing of labels, focus, selected state, and uncertainty. |

## Phase 5Q visual-foundations exercise

Run this exercise at the start of 5Q.4, before broad route redesign. It is a
bounded diagnostic and alternative-generation pass, not an aesthetic freeze.

1. **Route/task matrix:** for every route, name the primary reader question,
   first useful action, shareable state, mobile/equivalent path, and supported
   claim.
2. **Baseline capture:** collect consistent screenshots and task recordings at
   representative widths; record DOM/payload/performance, keyboard order,
   zoom/reflow, screen-reader naming, and current comprehension failures.
3. **Encoding inventory:** list every quantitative, categorical, temporal,
   confidence, selection, and interaction encoding. Identify color-only state,
   unjustified chart types, misleading precision, and incompatible
   denominators.
4. **Type/color/layout specimen:** test the current tokens on real project
   content, including difficult names, dense caveats, axes, focus states,
   dark-network contexts, grayscale, and common color-vision simulations.
5. **Alternatives before polish:** make low-fidelity static alternatives for
   the highest-risk views—table/prose, small multiples, focused network, or
   summary/list equivalents—before tuning motion or decorative detail.
6. **Route slices:** implement one end-to-end route at a time, starting with
   Explore, then Timeline, then the dense Lineage/Migration family. Each slice
   passes the review gates in `docs/ROADMAP.md` before the pattern propagates.
7. **Decision record:** preserve before/after evidence, rejected alternatives,
   unresolved risks, and the next test. Update the design system only when a
   pattern has earned reuse.

Required proposal template for a new visualization:

```markdown
Reader and question:
Decision or insight enabled:
Data and task abstraction:
Encoding and interaction rationale:
Uncertainty and missingness:
Accessible equivalent:
Performance/data budget:
Success signal:
Stop or simplify condition:
```

## Temporal, multilayer, and cultural graphs

| Foundation | Practice in this project | Verification |
|---|---|---|
| Temporal-network research treats ordering, duration, and time-respecting paths as structurally important—not metadata pasted onto a static graph. | Preserve intervals/precision and compute temporal neighborhoods or paths from time-aware relations. A static path is never described as a historically possible chain without time checks. | Temporal tests cover interval logic; every temporal view names its time model and uncertainty. |
| Multilayer-network research models different relationship types as coupled layers rather than one undifferentiated edge soup. | Teaching/influence, institution, place, movement, collaboration, works, and similarity remain independently selectable and comparable. | Readers can inspect the active layer and its semantics; metrics record the layer/projection used. |
| Leiden community detection improves connectivity guarantees over Louvain but does not make a community historically “real.” | If used, run per justified layer/time slice and report resolution, seed, stability, source sensitivity, and comparison with named groups. | Analysis is reproducible across seeds/parameters and conclusions survive or disclose instability. |
| Dynamic-graph visualization research shows a tradeoff between animation/mental-map continuity and side-by-side comparability. | Prototype small multiples, event bands, or matrices before animation. Use animation only when change itself is the task and reduced-motion/equivalent paths exist. | A simpler static baseline is included in the experiment and interpretation test. |
| CIDOC CRM and Linked Art model cultural heritage through entities, events/activities, places, objects, people, and assertions. | Use them as interoperability checks when defining the artist-neutral semantic layer; do not copy their complexity into route JSON without a use case. | An architecture decision maps local concepts to relevant external concepts and documents intentional divergences. |
| W3C PROV-O distinguishes entities, activities, agents, and derivation. | Preserve source assertions and transformation/derivation history separately from the cultural relationship being asserted. | A derived edge can be traced to source assertion(s), method/version, retrieval time, and generated output. |

Network-analysis guardrails:

- A centrality score means only what its chosen nodes, edges, direction, weights, time window, and missing data make it mean.
- Co-presence, shared affiliation, similarity, a graph path, and predicted links are hypotheses/signals—not proof of influence.
- Compare results after removing dominant sources, low-confidence edges, or over-documented hubs.
- Prefer overlapping or multilayer explanations when exclusive clusters would distort the domain.
- Treat layout coordinates as presentation unless the algorithm and distance semantics explicitly make them analytical.

## Accessibility and inclusive use

The baseline is WCAG 2.2 Level AA, with visualization-specific requirements layered on top.

- Every interactive SVG has an accessible name and useful text alternative or adjacent summary.
- Keyboard users can reach and operate every consequential control and inspect an equivalent of chart details.
- Focus is visible; targets are sufficiently large; motion respects `prefers-reduced-motion`.
- Color is never the sole carrier of category, confidence, or state. Use shape, line style, pattern, position, label, or text.
- Dense visualizations need a non-visual reading path: summary, structured table/list, or downloadable data appropriate to the task.
- Mobile support is assessed per task. A deliberate simplified reading mode is acceptable for a graph; clipped or unreachable content is not.

Accessibility is verified with automated checks, keyboard-only use, zoom/reflow checks, high-contrast/forced-colors inspection where relevant, and at least one screen-reader pass on each novel interaction pattern.

## Data governance, provenance, and ethics

| Foundation | Practice in this project | Verification |
|---|---|---|
| Datasheets for Datasets | Maintain purpose, composition, collection/process, preprocessing, uses, distribution, maintenance, risks, and known gaps for published datasets. | `docs/DATASET_DATASHEET.md`, `/transparency`, the claim register, source docs, and export metadata remain aligned; material changes update each affected surface. |
| FAIR principles | Published data is findable, accessible, interoperable, and reusable to the degree licenses permit. | Stable schemas/identifiers, provenance, generated-at dates, licenses, versioned downloads, and citation guidance. |
| Data Feminism | Treat classification and absence as products of power and institutions, not neutral defects. Ask who benefits, who is missing, and whose categories are being reproduced. | Inclusion criteria, excluded-population summaries, source-attributed sensitive labels, provenance, and the domain/community-review triggers in `docs/CLAIM_REGISTER.md` are visible. |
| CARE principles | When Indigenous people, knowledge, or cultural heritage are implicated, evaluate collective benefit, authority to control, responsibility, and ethics in addition to open-data goals. | Do not assume that technically open source data authorizes every reuse; record consultation, restrictions, and non-use decisions where applicable. |
| Reproducible computational practice | Raw inputs, transformations, overrides, generated outputs, environments, and validation are separable and documented. | A clean environment can reproduce validated outputs or explains external/cache constraints; overrides carry rationale/provenance. |

Dataset release requirements:

- schema or data dictionary;
- source and license for every field family;
- generated-at date and pipeline/code version;
- inclusion/exclusion criteria and denominator;
- missingness and confidence summaries;
- transformations and curated overrides;
- known harms, blind spots, and intended/non-intended uses;
- machine-readable validation result or reproducible check command.

## Human-centered evaluation

Do not ask only whether users “like” a view. Test whether they can orient, interpret, act, and recognize limits.

Use a small formative study before expanding a novel pattern: five representative sessions are enough to reveal major usability failures, but not to estimate population-level rates. Record tasks, observed errors, time-to-orientation, interpretation, confidence, accessibility issues, and unexpected questions. Pair this with privacy-respecting aggregate analytics; never use click counts alone as evidence of understanding.

Core study prompts:

- What do you think this view is showing?
- What is the strongest pattern you see, and what supports it?
- What can this view not tell you?
- Find a named entity and share the exact state you reached.
- What would you investigate next?

## Performance and software quality

- Use Core Web Vitals “good” thresholds at the 75th percentile as the external baseline: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.
- Measure representative static routes and interactions; build size alone is not a user-performance metric.
- Route-load only the data required for the default view. Heavy graph layers remain opt-in and lazy-loaded.
- Keep deterministic data-contract tests, type checking, linting, production build, and focused performance benchmarks in CI.
- Treat dependency advisories by severity, reachability, fix risk, owner, and review date rather than by count alone.
- Prefer boring, reversible architecture until measured data or interaction scale justifies a new renderer or state system.

## Multi-agent repository practice

The repository uses `AGENTS.md` as the canonical vendor-neutral entry point and thin adapters for tools with their own discovery paths. This prevents instruction drift while respecting each tool’s documented convention.

| Tool | Adapter | Official convention used |
|---|---|---|
| Codex and compatible agents | `AGENTS.md` | Hierarchical `AGENTS.md`; closest file applies to scoped work. |
| Claude Code | `CLAUDE.md` | Project `CLAUDE.md` with an `@AGENTS.md` import. |
| Cursor | `.cursor/rules/project.mdc` | Repository project rule marked always-on. |
| Windsurf | `.windsurfrules` | Repository rules file; retained as the implementation-values source. |
| GitHub Copilot | `.github/copilot-instructions.md` | Repository-wide custom-instructions file. |
| Skill-aware agents | `.agents/skills/ship-pr/` and `.agents/skills/visual-qa/` | Optional instruction-only workflow accelerators; `AGENTS.md` remains authoritative. |

Unique policy must not live only in an adapter. When a tool cannot import another file, the adapter tells it which canonical files to read and contains only the minimum safe bootstrap rules.

### Review, preview, and task-boundary practice

The delivery evidence forms a chain rather than one undifferentiated “done”
state:

| Boundary | Question answered | Minimum evidence |
|---|---|---|
| Local implementation | Did one coherent change produce the intended result? | Scoped diff, proportional checks, and local review against the intended base. |
| Remote validation | Does the exact published commit pass reproducibly? | Remote head/PR identity plus GitHub Actions results and useful failure logs. |
| Preview validation | Does the hosted artifact correspond to that commit and build correctly? | Vercel Preview URL, source SHA, ready/build state, and deployment logs when needed. |
| Rendered QA | Does the interface work and communicate at representative viewports and input modes? | Route/task evidence, console, desktop/mobile, keyboard/accessibility, URL restoration, and the applicable visual gate. |
| Product decision | Should the change merge or the pattern propagate? | Required checks, rendered evidence, unresolved-risk ownership, and explicit founder decision where required. |

Manual local review is the default before every publish. An automated Codex or
other PR reviewer may be added later as an independent second perspective, but
it does not replace the scoped diff review, deterministic checks, rendered QA,
or the founder’s merge authority. Pilot it on a small number of draft PRs,
measure signal/noise and usage cost, and do not make it a required check until
its permissions, reliability, and false-positive handling are understood.

Each bounded agent task ends as **COMPLETE — safe to archive**, **REVIEW READY
— keep open**, or **BLOCKED — keep open**. The final handoff records exact
artifacts/checks and supplies a ready-to-paste prompt for the next bounded
task. This prevents long chats from becoming hidden project state and makes
parallel tasks safe only when their branches, files, and completion boundaries
are genuinely independent.

## Primary references

### Visualization and evaluation

- Tamara Munzner, “A Nested Model for Visualization Design and Validation,” *IEEE TVCG* 15(6), 2009. <https://doi.org/10.1109/TVCG.2009.111>
- Ben Shneiderman, “The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations,” 1996. <https://doi.org/10.1109/VL.1996.545307>
- William Cleveland and Robert McGill, “Graphical Perception,” *JASA* 79(387), 1984. <https://doi.org/10.1080/01621459.1984.10478080>
- Jessica Hullman, “Why Authors Don’t Visualize Uncertainty,” *IEEE TVCG* 26(1), 2020. <https://doi.org/10.1109/TVCG.2019.2934287>
- Matthew Brehmer and Tamara Munzner, “A Multi-Level Typology of Abstract Visualization Tasks,” *IEEE TVCG* 19(12), 2013. <https://doi.org/10.1109/TVCG.2013.124>

### UX, cultural collections, typography, and color

- ISO 9241-210:2019, *Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems*. <https://www.iso.org/standard/77520.html>
- Peter Pirolli and Stuart Card, “Information Foraging,” *Psychological Review* 106(4), 1999. <https://doi.org/10.1037/0033-295X.106.4.643>
- Mitchell Whitelaw, “Generous Interfaces for Digital Cultural Collections,” *Digital Humanities Quarterly* 9(1), 2015. <http://www.digitalhumanities.org/dhq/vol/9/1/000205/000205.html>
- Johanna Drucker, “Humanities Approaches to Graphical Display,” *Digital Humanities Quarterly* 5(1), 2011. <http://www.digitalhumanities.org/dhq/vol/5/1/000091/000091.html>
- Robert Bringhurst, *The Elements of Typographic Style*, version 4.0, Hartley & Marks, 2012.
- Mark Harrower and Cynthia Brewer, “ColorBrewer.org: An Online Tool for Selecting Colour Schemes for Maps,” *The Cartographic Journal* 40(1), 2003. <https://doi.org/10.1179/000870403235002042>
- Fabio Crameri, Grace E. Shephard, and Philip J. Heron, “The misuse of colour in science communication,” *Nature Communications* 11, 2020. <https://doi.org/10.1038/s41467-020-19160-7>
- W3C, *CSS Color Module Level 4* (OKLCH and related color spaces; current web standard). <https://www.w3.org/TR/css-color-4/>

### Accessibility and web performance

- W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*. <https://www.w3.org/TR/WCAG22/>
- W3C, *SVG Accessibility API Mappings 1.0*. <https://www.w3.org/TR/svg-aam-1.0/>
- Google web.dev, *Web Vitals*. <https://web.dev/articles/vitals>

### Data and reproducibility

- Timnit Gebru et al., “Datasheets for Datasets,” *Communications of the ACM* 64(12), 2021. <https://doi.org/10.1145/3458723>
- Mark Wilkinson et al., “The FAIR Guiding Principles for scientific data management and stewardship,” *Scientific Data* 3, 2016. <https://doi.org/10.1038/sdata.2016.18>
- Catherine D’Ignazio and Lauren Klein, *Data Feminism*, MIT Press, 2020. <https://data-feminism.mitpress.mit.edu/>
- Global Indigenous Data Alliance, *CARE Principles for Indigenous Data Governance*. <https://www.gida-global.org/care>
- Greg Wilson et al., “Good Enough Practices in Scientific Computing,” *PLOS Computational Biology* 13(6), 2017. <https://doi.org/10.1371/journal.pcbi.1005510>

### Temporal networks, graph methods, and cultural heritage

- Petter Holme and Jari Saramäki, “Temporal Networks,” *Physics Reports* 519(3), 2012. <https://doi.org/10.1016/j.physrep.2012.03.001>
- Mikko Kivelä et al., “Multilayer Networks,” *Journal of Complex Networks* 2(3), 2014. <https://doi.org/10.1093/comnet/cnu016>
- Vincent Traag, Ludo Waltman, and Nees Jan van Eck, “From Louvain to Leiden: guaranteeing well-connected communities,” *Scientific Reports* 9, 2019. <https://doi.org/10.1038/s41598-019-41695-z>
- Fabian Beck et al., “The State of the Art in Visualizing Dynamic Graphs,” *Computer Graphics Forum* 33(3), 2014. <https://doi.org/10.1111/cgf.12417>
- Marten Düring et al., “Exploring dynamic multilayer graphs for digital humanities,” *Applied Network Science* 5, 2020. <https://doi.org/10.1007/s41109-020-00295-x>
- CIDOC Conceptual Reference Model: <https://www.cidoc-crm.org/>
- Linked Art Data Model: <https://linked.art/model/>
- W3C, *PROV-O: The PROV Ontology*. <https://www.w3.org/TR/prov-o/>

### Agent configuration

- AGENTS.md open format: <https://agents.md/>
- OpenAI, *Custom instructions with AGENTS.md*: <https://learn.chatgpt.com/docs/agent-configuration/agents-md>
- Anthropic, *How Claude remembers your project*: <https://code.claude.com/docs/en/memory>
- Cursor, *Best practices for coding with agents*: <https://cursor.com/blog/agent-best-practices>
- Windsurf, *Introduction to Rules, Memories, & Workflows*: <https://windsurf.com/university/general-education/intro-rules-memories>
- GitHub, *Adding repository custom instructions for GitHub Copilot*: <https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions>
- GitHub Actions, official releases for
  [`actions/checkout`](https://github.com/actions/checkout/releases),
  [`actions/setup-node`](https://github.com/actions/setup-node/releases), and
  [`actions/setup-python`](https://github.com/actions/setup-python/releases).
- Vercel, *Node.js Versions*: <https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>
