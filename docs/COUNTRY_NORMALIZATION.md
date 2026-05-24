# Country-name normalization

## Why this exists

Wikidata stores citizenship (P27), place of birth (P19) and place of
death (P20) using the historical state name in force at the time of
the event. A sculptor born in Munich in 1850 is registered under
"Kingdom of Bavaria"; one born there in 1880 is "German Empire"; one
born there in 1920 is "Weimar Republic" via the "German Reich" label.
All three are, for our purposes, Germany.

The migration Sankey, the Explore table's Citizenship column, and the
multi-citizenship pills on detail pages all surface these labels
directly. Without normalization, what is really one country fragments
across multiple corridors and table rows, the chart's top-N rollup
makes the fragmentation worse, and readers see a misleadingly noisy
record.

## What this does

A single hand-curated alias map at `pipeline/data/country_aliases.json`
maps historical or formal-state labels to a single modern display name.
The map is applied at one chokepoint — the end of `process_nodes()` in
`pipeline/process.py` — across four columns:

- `citizenship_display` (singular, used by the Explore table)
- `citizenships[]` (multi-pill, used on detail pages; element-wise + dedup)
- `birth_country` (used by the migration Sankey, decade pages, geography chart)
- `death_country` (used by the migration Sankey)

Every downstream JSON inherits the same vocabulary because the
normalization runs before the DataFrame is written to parquet and
re-loaded by `export_json.py`.

## Categories of rewrite

Every alias is tagged with a category in the JSON file so the
rationale travels with the data:

**Category A — formal name to display name (lossless).**
The polity is the same; only the label convention differs. These are
safe and unambiguous. Example: "Kingdom of the Netherlands" →
"Netherlands"; "People's Republic of China" → "China"; "Empire of
Japan" → "Japan".

**Category B — single-successor historical state (defensible, light info loss).**
The historical state was real and different from its modern
successor, but only one modern country emerged from it, and the
mapping aligns with how museum catalogs display the artist. Example:
"Kingdom of Prussia" → "Germany"; "Austrian Empire" → "Austria";
"Grand Duchy of Finland" → "Finland".

## Deliberately NOT normalized

Multi-successor historical states are left alone. Auto-mapping any of
these to a single modern country would silently encode an editorial
position the data doesn't support. Currently this includes:

- **Russian Empire / Russian SFSR / Soviet Union / Byelorussian SSR** —
  successors include Russia, Ukraine, Belarus, Lithuania, Latvia,
  Estonia, Poland, Finland, Georgia, Armenia, Kazakhstan, and others.
- **Czechoslovakia** — Czech Republic or Slovakia, depending on the
  sculptor's region of origin.
- **Yugoslavia (six labelled variants in the data)** — seven
  successor states.
- **Ottoman Empire** — 30+ successor states.
- **Yemen / Republic of China / Dominion of India** — political-status
  questions deferred until a stronger editorial position is in hand.

A future enhancement could disambiguate these on a per-record basis
using `birth_place` city — e.g. a Russian Empire citizen born in
Vilnius is now Lithuanian. That requires a curated city-to-modern-
country map and a documented disambiguation rule. It's tracked in the
ROADMAP under Phase 4+.

## Where this surfaces in the UI

- **Explore table** — Citizenship column. ~1200 rows previously showed
  a historical or formal-state label; now show the modern display name.
- **Detail page pills** — `citizenships[]` is normalized and de-duped,
  so a sculptor with both "Kingdom of Bavaria" and "German Empire" now
  shows a single "Germany" pill instead of two.
- **Migration view (`/migration`)** — corridor labels were already
  mostly clean (Wikidata's place→country resolver handles P19/P20);
  this work is defensive coverage there.
- **Decade pages, movement pages, geography chart** — all consume
  `citizenship_display` or `birth_country` from the same DataFrame, so
  they inherit the normalization for free.

## Transparency

The `/transparency` page renders a section showing:
- The size of the alias table and its category split (A vs. B).
- Per-run record-rewrite counts (citizenship, list collapses,
  birth/death country).
- The full deliberately-not-normalized list with rationale.

The counts come from a sidecar JSON
(`data/processed/country_normalization_counts.json`) written by
`process.py` and read by `export_json.py`. They regenerate on every
pipeline run.

## How to maintain the alias table

1. After a pipeline run, scan the published `transparency.json` (or
   re-run the audit script in `/tmp/audit_countries.py`) for new
   historical-state labels that have appeared in the cache since the
   last edit.
2. For each candidate, decide:
   - Is it a formal-name-to-display-name rewrite (Category A)?
   - Is it a single-successor historical state (Category B)?
   - Is it multi-successor (do nothing; document under
     `_meta.deliberately_not_normalized` if it isn't already).
3. Add the entry to `pipeline/data/country_aliases.json`.
4. Re-run the pipeline. The transparency page numbers will update on
   the next deploy.
