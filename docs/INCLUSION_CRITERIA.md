# Inclusion Criteria: Research + Recommendation

*Decision document for Phase 3a. Sets the notability bar for which sculptors appear on the published site.*

## The problem

The current filter drops **85.5%** of cached sculptors (5,728 of 6,700). Not because they're unnotable — because they lack a Wikidata `P135 movement` label. That property is filled in overwhelmingly for Western art-historical categories (Cubism, Symbolism, Minimalism). The filter's effect is a near-total exclusion of non-Western sculptors (67–100% dropout rates across Japan, Mexico, Brazil, Turkey, Iran, Korea, Indonesia, Argentina, Chile, Ghana, etc.) and a severe truncation of the European base (1,831 Germans, 575 French, 551 Dutch all dropped).

The question isn't *whether* to relax this — it's *with what principled replacement.*

---

## How reputable institutions actually decide

### Getty ULAN (Union List of Artist Names, ~300K+ entities)
- **Criterion:** "Warrant" — the name must appear in ≥3 reputable published sources.
- **Stance:** "Authoritative but not authoritarian." Explicitly bibliographic, not evaluative.
- **Bias:** Historically Western-biased via source selection; actively diversifying.
- **Takeaway:** Inclusion = documented by someone reputable. Does not claim to identify "great" artists.

### Grove Art Online (Oxford, ~45,000 topics)
- **Criterion:** Editorial committee + invited expert contributions.
- **Stance:** Explicit commitment (in published Editorial Policies) to "a global history of art that is inclusive, multicultural."
- **Bias:** Curatorial gatekeeping, but transparent about it; continuously revised.
- **Takeaway:** Editorially chosen inclusion, transparent about the people deciding.

### Benezit Dictionary of Artists (~170,000)
- **Criterion:** More exhaustive; incorporates auction/market records.
- **Bias:** Market data itself encodes Western/male bias. Auction prominence ≠ artistic significance.
- **Takeaway:** Market signal is seductively concrete but biased at the root.

### Wikidata (~∞)
- **Criterion:** Community editing, no gatekeeping for entity existence.
- **Bias:** Reflects who edits (predominantly Western, male, English-speaking). Property coverage (especially P135 movement) is Western-centric.
- **Takeaway:** Entity existence in Wikidata is a weak signal. Which *properties* are populated is a stronger one.

### Wikipedia (variable by language)
- **Criterion:** "Significant coverage in reliable sources" per WP:N; interpreted per language community.
- **Stance:** Each language Wikipedia has its own notability standards and cultural focus. A Japanese-only-Wikipedia sculptor is notable *in Japanese discourse*.
- **Takeaway:** **Sitelink count across languages is one of the best language-independent notability signals available.** It proxies for "has been documented by multiple, independent language communities."

### Museum collections (SAAM, Met, AIC, Tate, etc.)
- **Criterion:** Work held in a public collection.
- **Stance:** Scope-limited but can surface artists excluded elsewhere (folk, Indigenous, outsider, regional-modern).
- **Takeaway:** Collection presence is authority-backed inclusion, just with national/thematic biases.

---

## How art history discourse frames this

- **Linda Nochlin, "Why Have There Been No Great Women Artists?" (1971):** the frame of "greatness" itself encodes structural exclusion. Any inclusion criterion that privileges existing documentation reproduces existing gaps.
- **Griselda Pollock (feminist art history):** the archive is a site of political negotiation. What's preserved and indexed is not neutral.
- **Rafael Cardoso (*Texte zur Kunst*, 2022):** decolonizing the canon requires not just *expanding* inclusion but changing *which criteria matter*.
- **Paul Chaat Smith, Jolene Rickard (Indigenous art scholarship):** Western museum/authority frameworks sometimes cannot capture Indigenous practice because of framing differences (individual vs. communal; object vs. ceremony).
- **British Academy "Decolonising Art History" blog:** artists exist translocally and transnationally; single-nation frames distort.
- **Artsy, 2019; Grove Art's "Diverse Perspectives" initiative, ongoing:** the mainstream consensus is moving from implicit gatekeeping toward explicit multi-perspectival inclusion.

**The practical principle that falls out:** don't try to identify "important" sculptors yourself. Trust *multiple independent institutions* as signals, make that stack explicit, and be transparent about the gaps that remain.

---

## Technical signals available to our pipeline

### Already in cache (no new queries)
| Signal | What it indicates | Coverage in our data |
|---|---|---|
| Wikidata P135 movement | Western-art-historical categorization | ~1,300 sculptors |
| Wikidata P737 influenced_by | Influence relation | ~200 edges |
| Wikidata P1066 student_of | Documented mentorship | ~350 edges |
| Multi-citizenship record | Multi-national life | 849 sculptors |
| On Fabio's focus list | Curatorial endorsement | 34 sculptors |

### New signals available via single SPARQL query each
| Signal | What it indicates | Why it matters |
|---|---|---|
| **Wikipedia sitelinks count** | Documented in N language Wikipedias | Single best **language-independent** notability proxy. Catches Japanese-only, Spanish-only, etc. |
| **Getty ULAN ID (P245)** | Getty's bibliographic warrant (≥3 sources) | Strongest *authority*-backed signal. Already embedded as a Wikidata property — just not fetched. |
| **VIAF ID (P214)** | Aggregated national-library authority | Corroborates ULAN. |
| **Wikidata image (P18)** | Has a representative image | Weak but useful as tie-breaker |
| **Place of birth (P19)** | Biographical grounding | Also the Phase 3a geography goal |

### Future signals (arrive with phase 3b/3c data sources)
| Signal | Source | Adds |
|---|---|---|
| ULAN nationality/activity record | Getty ULAN SPARQL | Multi-national lives at authority level |
| SAAM collection presence | SAAM LOD | American-collected artists (biased US but surfaces Great Migration / Indigenous / folk) |
| Met / AIC collection presence | Museum APIs | Global modern + non-Western (Met Islamic/East Asian depts) |
| ULAN "warrant" metadata | Getty ULAN | Count of bibliographic sources per artist |

---

## Top options ranked

### Option A (recommended): Principled multi-signal + layered presentation

**Inclusion rule:** A sculptor appears in the published site if ANY of these signals fires:
1. Wikidata movement label (current)
2. Wikidata influence/student edge (current)
3. On the curated focus list (current)
4. Multi-citizenship record (cached, not currently used)
5. **Wikipedia sitelinks ≥ 2 languages** (new query, ~5 min to implement)
6. **Has Getty ULAN ID (P245)** (new query, ~5 min)
7. **Has VIAF ID (P214)** (new query, ~5 min)

**Presentation:**
- **Aggregations** (geography charts, movement counts, decade bars) use *all 6,700* cached sculptors. The base rate is honest.
- **Editorial views** (timeline hero, focus cards, detail pages) use the filtered inclusion set.
- **Explore table** paginates the filtered set with sort/filter/search. "Show all data" toggle offers the full 6,700 for power users.
- **Per-sculptor provenance:** detail page shows which specific signals fired ("included via: Getty ULAN + multi-citizenship + Japanese & English Wikipedia").
- **Named gaps page:** honest audit of who's still missing and why.

**Projected coverage:** ~3,000–5,000 filtered set. All 6,700 in aggregates.

**Pros**
- Principled: inclusion defers to named institutions, not our judgement
- Fair: explicitly pluralist — Western movement labels don't gatekeep non-Western sculptors who have sitelinks or ULAN IDs
- Transparent: About page can explain the exact criteria; detail pages show provenance
- Forward-compatible: every new source (ULAN, SAAM, Met) *adds* signals without breaking criterion
- Implementable: 2-3 small queries + schema tweak + layered export logic = ~1 session

**Cons**
- More implementation work than a one-line filter change
- Requires thinking about chart-level presentation (aggregate vs. editorial)
- Needs UI surface for per-sculptor provenance (small addition, still work)

### Option B: Simple any-signal relaxation (no new queries)

Include any sculptor with ANY cached property (movement, edge, citizenship, focus).

**Pros:** Zero new queries. Deployable today. Reasonable fairness step up from current.
**Cons:** Less principled — "has citizenship" is a weak signal (98% of cached sculptors have it). Doesn't leverage sitelinks/ULAN/VIAF which are the most *authority-backed* signals. Covers the "Why this sculptor?" question poorly.
**Projected coverage:** ~6,500 (basically everyone with any data — not meaningfully different from "include all").

### Option C: Include all 6,700

Drop the filter entirely.

**Pros:** Maximally inclusive, simplest change, most honest about the cache.
**Cons:** Many sculptors have only name + dates in our data. Charts swamped by data-rich countries (Germany). Doesn't help non-Western coverage much — the non-Western gap is a *Wikidata coverage* problem, not a *our filter* problem. Relieves symptoms, not causes.
**Projected coverage:** 6,700.

### Option D: Editorial/curated — keep small, hand-pick

Ignore Wikidata's coverage problem entirely; work from a curated list (Fabio's 34 + expand).

**Pros:** Highest per-entry quality. Strong editorial voice. Model used by Grove Art, curated exhibitions.
**Cons:** Re-introduces gatekeeping — contradicts the site's stated "lens on structured public data" premise. Doesn't scale.
**Projected coverage:** Whatever is curated. Currently 34.

---

## How the recommendation evolves as we add sources

| Phase | New signals available | Effect on filter | Effect on coverage |
|---|---|---|---|
| **3a (now)** | Sitelinks, ULAN-ID, VIAF-ID, P19 birth-place | Filter hardens on authority signals | Filtered set ~3,000–5,000; aggregates unchanged |
| **3b (ULAN)** | ULAN nationalities, activity places, warrant count | Warrant count replaces proxy signals where available | Better metadata for filtered sculptors; edge-of-set may grow modestly |
| **3c (SAAM)** | SAAM collection presence, narratives | New signal adds American/Indigenous/folk/Great-Migration sculptors | Small growth, possibly ~100–200 more |
| **Phase 4+ (Met, AIC)** | Major-museum collection presence, images | Biggest non-Western expansion via Met's Islamic/East Asian/African holdings | Filtered set may reach ~5,000–6,000 |

**Key insight:** each data source strictly *adds* signals. The inclusion criterion never has to be re-defined; it just gets richer. This is the deepest argument for Option A over B/C/D — it's the only option that *improves with data* rather than becoming obsolete.

---

## Design principles that accompany Option A

1. **Explicit criteria on About page.** Name the signals and why we trust each one.
2. **Per-sculptor provenance transparency.** Every detail page should answer "why is this person in the dataset?"
3. **Honest aggregation vs. editorial curation.** Aggregate charts use all 6,700; editorial views use the filtered set. Explain the split on the About page.
4. **Named gaps.** A "What we're missing" or "Hidden from view" page quantifies remaining exclusions by region, era, and gender.
5. **"Warrant" philosophy, not "quality" philosophy.** We document what others have documented. We don't rank.

---

---

## Stress test: six independent expert perspectives

Before finalizing Option A, pressure-tested against six domain experts. Each challenges a different assumption.

### Expert 1 — Information scientist / data engineer
*(specialty: authority control, signal correlation, data quality metrics)*

**Critique:** "Your 'seven signals' are not seven. **ULAN-ID, VIAF-ID, and Wikipedia sitelinks are strongly correlated** — they tend to fire together because they reflect the same underlying phenomenon (a sculptor being documented in Euro-American authority systems). Treating them as independent creates false diversity in the signal stack. 'Any of these 3' is approximately 'is a Western-documented artist.'"

**Also:** "Why ≥2 sitelinks and not 1 or 3? The threshold is arbitrary. Also, sitelinks are mutable — a sculptor's count changes over time. Document the snapshot date."

**Recommendation:** Collapse the three authority signals into ONE signal ("has any external authority identifier"). Be explicit about thresholds and their rationale. Consider a weighted score rather than binary OR-gate.

### Expert 2 — Decolonial art historian
*(specialty: postcolonial critique, non-Western art, institutional theory)*

**Critique:** "You think you're decolonizing by deferring to 'multiple independent institutions.' But ULAN, VIAF, national libraries, and English-Wikipedia are all nodes in the same Euro-American scholarly network. Deferring to them *launders* the bias through external authority rather than addressing it. You haven't escaped Nochlin's trap; you've institutionalized it."

**Also:** "The 'warrant' concept — inclusion requires bibliographic documentation — is structurally biased against oral tradition, Indigenous ceremonial sculpture, collective/anonymous religious-commercial production, and recent post-colonial recovery scholarship that hasn't been indexed yet. You will include 19th-century minor European academics over 20th-century major African modernists, as a systematic matter."

**Recommendation:** Stop pretending this is a global survey. Scope the project honestly: "Sculptors documented in Euro-American authority systems since 1800." Add a dedicated page explaining that scope limit and what it excludes. Don't call it "sculpture," call it what it is: "sculpture documented in the Western art-historical archive."

### Expert 3 — Working museum curator
*(specialty: sculpture collections, practical metadata at scale)*

**Critique:** "Your signal stack ignores the single strongest signal we use in practice: **museum collection presence**. If SAAM or the Met holds their work, they're real. More real than any Wikipedia article. When you add those sources in 3b/3c, they should dominate the filter, not sit equal with ULAN-ID."

**Also:** "You'll encounter edge cases your system doesn't handle — posthumously discovered folk artists, husband-wife collaborative pairs, workshop production, pseudonymous makers, living artists who've been collected but not yet Wiki-documented. Be honest that some won't fit the schema."

**Also:** "Fabio's 34 is small. Real projects in our field usually start from 200-500 curated entries. The curated-list signal is too thin right now."

**Recommendation:** Weight museum-collection signals higher than authority-ID signals once they're in. Plan to expand Fabio's list to ~100-200 in a later phase.

### Expert 4 — Wikidata/Wikipedia community veteran
*(specialty: editorial dynamics, property coverage, WikiProject biases)*

**Critique:** "P135 (movement) is under-populated even for well-known *Western* sculptors. Calder is barely tagged. Don Judd is inconsistently labeled. It's a weak signal in both directions."

**Also:** "P245 (ULAN ID) has high precision but **low recall** — it's only present when a Wikidata editor added it. Many sculptors who are in ULAN have no P245 linkback yet. You'll be filtering by 'Wikidata editor noticed to add this' rather than 'is in ULAN.'"

**Also:** "Sitelinks are reliable for 'does this language Wikipedia have an article?' but different WikiProjects have very different creation patterns. Tagalog Wikipedia has systematic bot-created biographical stubs. Cebuano Wikipedia is almost entirely bot-generated. A raw sitelink count conflates editorial community attention with bot activity."

**Recommendation:** Require sitelinks to be **≥2 languages AND at least one non-English** (the non-English requirement makes this a real globality signal, not a false one). Exclude bot-dominated Wikipedias from the count (Cebuano, Waray). Consider adding P106 (occupation) check that `sculptor` is listed as a primary occupation, not just one of many.

### Expert 5 — Product / UX designer
*(specialty: information design, public-facing data products)*

**Critique:** "'Layered presentation' is cognitively expensive. Casual users won't understand why one chart says 162 Americans but the table shows 75. You'll either have to explain it every time (annoying) or hide it (dishonest)."

**Also:** "'Show inclusion signals on every detail page' is niche. 95% of visitors don't care why a sculptor is included; they want the life story. Don't clutter the detail page with epistemology."

**Recommendation:** Keep the layered approach but surface the provenance in ONE dedicated place (a combined "About the data / Hidden from view" transparency page), not on every detail page. Skip the "Show all data" toggle in Explore — most users won't touch it. Make the filtered set the main experience and expose the full 6,700 via the transparency page only.

### Expert 6 — Authority-control librarian
*(specialty: VIAF, LCNAF, international library cataloging)*

**Critique:** "VIAF is less useful than it sounds for living-artist contexts. It aggregates national library authorities, but for artists specifically, VIAF coverage is ~90% redundant with ULAN. The incremental value as an inclusion signal is small."

**Also:** "National authority files often cover local artists better than VIAF-aggregate. Wikidata has properties for: LCNAF (US), BnF (France), DNB (Germany), National Diet Library (Japan), BNE (Spain), etc. If you really want authority-signal diversity, look at these regional IDs — not VIAF."

**Recommendation:** Drop VIAF as a separate signal. Either rely on ULAN alone or broaden to "has any library/authority identifier from a recognized national or international authority file" as one combined signal.

### Expert 7 — Ethics / data justice scholar
*(specialty: algorithmic fairness, representation in cultural datasets)*

**Critique:** "Every filter you apply is an editorial choice with ethical weight. Framing inclusion as 'principled' by deferring to institutions doesn't make it neutral — it just relocates the editorial voice. You're still choosing which institutions to trust, and those choices carry their own politics (Getty is well-funded Western; national libraries reflect national priorities)."

**Also:** "The 'transparent criteria' framing is good but incomplete. You should also publish a *demographic audit* of your inclusion set — its gender, regional, and temporal distribution — and update it when the criterion changes. Don't just explain what you do; show the outcome."

**Recommendation:** Pair the inclusion criterion with a standing **audit page** that shows current demographic breakdowns of included vs. excluded sets. Make the audit part of the commitment, not a one-time footnote.

---

## Synthesis: what actually changes

The experts converge on five meaningful critiques of Option A. Four require changing the design; one requires changing the framing.

| Critique | Source experts | Resolution |
|---|---|---|
| **Signal correlation** — ULAN + VIAF + sitelinks are not independent | Data Eng, Librarian | Collapse to ONE combined authority signal. Drop VIAF as separate. |
| **Sitelinks need non-English requirement** to be a real globality signal | Wikidata veteran | Change from "≥2 sitelinks" to "≥2 sitelinks with ≥1 non-English, excluding bot-dominated Wikipedias" |
| **Layered presentation is cognitively expensive** | UX | Move per-sculptor provenance to ONE transparency page. Skip "Show all" toggle in Explore. |
| **Scope honesty** — this isn't a global sculpture survey | Decolonial AH, Ethics | Reframe on About page: "Sculptors documented in Euro-American authority systems since 1800." Own the limit. |
| **Museum collection signals should dominate once present** | Curator | Document that Phase 3b/3c will reweight the stack. Note in criteria. |
| **Demographic audit as a standing commitment** | Ethics | Add a standing audit page, not a one-time footnote. |

## Refined recommendation — Option A.2

**Inclusion rule (simpler, more honest):**

A sculptor is included if ANY of:
1. Has a Wikidata movement label (P135), **or**
2. Has an influence/student edge (P737/P1066) to another sculptor in the dataset, **or**
3. Is on the curated focus list, **or**
4. Has a multi-citizenship record (≥2 distinct citizenships cached), **or**
5. **Has any external authority identifier** (Getty ULAN, LCNAF, BnF, DNB, National Diet Library, BNE, or VIAF — unioned, one signal), **or**
6. **Has Wikipedia articles in ≥2 languages AND ≥1 of those is non-English**, excluding bot-dominated Wikipedias (Cebuano, Waray)

Future signals arriving in later phases:
7. *(Phase 3b)* Has ULAN warrant count ≥ 3 (strengthens criterion when present)
8. *(Phase 3c)* Has work in SAAM collection
9. *(Phase 4+)* Has work in Met or AIC collection

When signals 7-9 arrive, they become **preferred** signals (heavier-weighted), not additional gates. The 1-6 rule stays as a floor.

**Presentation (simpler):**
- **Aggregate charts** use all 6,700 cached sculptors.
- **Editorial views** (timeline, focus, explore) use the filtered set (~3,000-5,000 projected).
- **ONE combined transparency page** — "About the data + Hidden from view" — explains criteria, shows demographic audit (gender / region / decade distribution of included and excluded), documents gaps.
- Detail pages do **not** show inclusion signals inline (UX complexity). Transparency is consolidated to one page.
- No "show all data" toggle — filtered set IS the experience. Transparency page shows the full 6,700 shape.

**Scope framing (honest):**
Reframe the project on the About page: *"This site explores sculptors active since 1800 who are documented in Euro-American authority systems — Getty ULAN, national library catalogs, multi-language Wikipedia, and museum collections. It is a lens on the Western art-historical archive, not a global survey of sculpture. The transparency page documents what this scope excludes."*

**Standing commitment:**
The transparency page is maintained, not one-time. It updates with every pipeline run to show current demographic distribution. When scope-widening data sources are added (SAAM, Met, AIC), the page shows the *change* in distribution, not just the latest snapshot.

---

## What A.2 changed relative to A

- 6 signals instead of 7 (VIAF folded into authority-IDs; authority-ID and sitelinks no longer pretend to be independent)
- Sitelinks requires **non-English component**, not just raw count (real globality signal)
- Sitelinks excludes **bot-dominated Wikipedias**
- **Museum signals explicitly flagged as preferred** when they arrive in later phases
- **Scope statement** added to About page — the project is explicitly a view into Euro-American art-historical documentation, not a global survey
- **Detail pages stay clean** — no per-sculptor inclusion provenance
- **Transparency consolidated** to ONE combined page with standing demographic audit
- **"Show all" toggle dropped** — simpler UX

## Implementation estimate for Option A

| Step | Time | Blocks |
|---|---|---|
| Add SPARQL queries (sitelinks, ULAN-ID, VIAF-ID) | 30 min | Nothing — single-property queries |
| Update `process.py` with new signal columns | 30 min | Queries done |
| Update filter + add `inclusion_signals` array field | 15 min | Above done |
| Update export to include aggregate-level counts using full 6,700 | 30 min | Above done |
| TypeScript types update | 15 min | Above done |
| About page: explain criteria | 20 min | |
| Detail page: show inclusion signals | 30 min | Schema change |
| **Total** | **~3 hours** | One focused session |

Can be deployed incrementally at any point.
