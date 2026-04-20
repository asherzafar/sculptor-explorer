"""Analyze the new enrichment cache to see what we've actually gained.

Reports per-signal coverage, overlap with existing filter, and the projected
new inclusion set under Option A.2.
"""
from __future__ import annotations

import pandas as pd
import json

sitelinks    = pd.read_parquet("../data/raw/sculptor_sitelinks_1800plus.parquet")
authorities  = pd.read_parquet("../data/raw/sculptor_authority_ids_1800plus.parquet")
birth_places = pd.read_parquet("../data/raw/sculptor_birth_places_1800plus.parquet")
death_places = pd.read_parquet("../data/raw/sculptor_death_places_1800plus.parquet")
native_names = pd.read_parquet("../data/raw/sculptor_native_names_1800plus.parquet")

nodes        = pd.read_parquet("../data/raw/sculptor_nodes_raw_1800plus.parquet")
movements    = pd.read_parquet("../data/raw/sculptor_movements_1800plus.parquet")
citz         = pd.read_parquet("../data/raw/sculptor_citizenships_1800plus.parquet")
relations    = pd.read_parquet("../data/raw/sculptor_relations_1800plus.parquet")

with open("../web/public/data/sculptors.json") as f:
    published = {s["qid"] for s in json.load(f)}

# Focus list
with open("../web/public/data/focus_sculptors.json") as f:
    focus_qids = {s["qid"] for s in json.load(f)}

total = len(nodes)
all_qids = set(nodes["qid_clean"])

print(f"Total sculptors in cache: {total}")
print(f"Currently published: {len(published)}")
print()

# ============================================================================
# Per-signal coverage
# ============================================================================
print("=== Coverage per Option A.2 signal ===\n")

# Signal 1: Wikidata movement label
has_movement = set(movements["qid_clean"])
print(f"Signal 1 — Wikidata movement label: {len(has_movement & all_qids):>5} sculptors ({100*len(has_movement & all_qids)/total:.1f}%)")

# Signal 2: Influence/student edge
has_edge = set(relations["to_qid"]) | set(relations["from_qid"])
has_edge &= all_qids  # only sculptors in our set
print(f"Signal 2 — Influence/student edge: {len(has_edge):>5} sculptors ({100*len(has_edge)/total:.1f}%)")

# Signal 3: On curated focus list
has_focus = focus_qids & all_qids
print(f"Signal 3 — On focus list:          {len(has_focus):>5} sculptors ({100*len(has_focus)/total:.1f}%)")

# Signal 4: Multi-citizenship (≥2)
per_c = citz.groupby("qid_clean").size()
has_multi_citz = set(per_c[per_c >= 2].index) & all_qids
print(f"Signal 4 — Multi-citizenship (≥2): {len(has_multi_citz):>5} sculptors ({100*len(has_multi_citz)/total:.1f}%)")

# Signal 5: Any authority ID (ULAN, VIAF, LCNAF, BnF, DNB, NDL, BNE)
has_authority = set(authorities["qid_clean"]) & all_qids
print(f"Signal 5 — Any authority ID:       {len(has_authority):>5} sculptors ({100*len(has_authority)/total:.1f}%)")

# Signal 6: Wikipedia sitelinks ≥2 languages AND ≥1 non-English
# (ceb, war already excluded from cache)
sl_per = sitelinks.groupby("qid_clean")["lang"].agg(list)
def qualifies(langs):
    if len(langs) < 2:
        return False
    return any(l != "en" for l in langs)
qualifying_qids = set(sl_per[sl_per.apply(qualifies)].index) & all_qids
print(f"Signal 6 — Multi-lang Wikipedia:   {len(qualifying_qids):>5} sculptors ({100*len(qualifying_qids)/total:.1f}%)")

print()
print("=== Bonus enrichment (not inclusion signals, but data we got) ===")
has_birth = set(birth_places["qid_clean"]) & all_qids
has_death = set(death_places["qid_clean"]) & all_qids
has_native = set(native_names["qid_clean"]) & all_qids
print(f"Has P19 birth place:    {len(has_birth):>5} ({100*len(has_birth)/total:.1f}%)")
print(f"Has P20 death place:    {len(has_death):>5} ({100*len(has_death)/total:.1f}%)")
print(f"Has P1559 native name:  {len(has_native):>5} ({100*len(has_native)/total:.1f}%)")

# ============================================================================
# New inclusion set
# ============================================================================
print()
print("=== New inclusion set (Option A.2) ===\n")

new_included = has_movement | has_edge | has_focus | has_multi_citz | has_authority | qualifying_qids
new_included &= all_qids

print(f"Current filter included:         {len(published):>5} ({100*len(published)/total:.1f}%)")
print(f"Option A.2 inclusion set:        {len(new_included):>5} ({100*len(new_included)/total:.1f}%)")
print(f"  Net new sculptors included:    {len(new_included - published):>5}")
print(f"  Sculptors no longer included:  {len(published - new_included):>5}")
print(f"  Total dropped under A.2:       {total - len(new_included):>5}")

# ============================================================================
# Non-Western coverage change
# ============================================================================
print()
print("=== Non-Western coverage under Option A.2 ===")
non_western = [
    "Japan", "China", "Republic of Korea", "South Korea", "India",
    "Nigeria", "Kenya", "South Africa", "Brazil", "Mexico",
    "Argentina", "Chile", "Peru", "Colombia", "Egypt",
    "Turkey", "Iran", "Indonesia", "Philippines", "Vietnam",
    "Ghana", "Senegal", "Ethiopia", "Morocco", "Lebanon",
]
print(f"{'Country':<20} {'Total':>6} {'Old incl.':>10} {'New incl.':>10} {'Δ':>5}")
for c in non_western:
    qids_in_country = set(citz[citz["citizenshipLabel"] == c]["qid_clean"])
    total_c = len(qids_in_country)
    if total_c == 0:
        continue
    old_in = len(qids_in_country & published)
    new_in = len(qids_in_country & new_included)
    print(f"  {c:<18} {total_c:>6} {old_in:>10} {new_in:>10} {new_in - old_in:>+5}")

# ============================================================================
# Migration story: sculptors where birth country ≠ citizenship
# ============================================================================
print()
print("=== Migration story preview ===")
bp = birth_places[["qid_clean", "country_label"]].drop_duplicates().dropna()
cz_first = citz.groupby("qid_clean")["citizenshipLabel"].first().rename("citizenship")
merged = bp.merge(cz_first, left_on="qid_clean", right_index=True, how="inner")
# Filter to published + new inclusion
merged = merged[merged["qid_clean"].isin(new_included)]
immigrants = merged[merged["country_label"] != merged["citizenship"]]
print(f"In new inclusion set with both birth country AND citizenship: {len(merged)}")
print(f"Of those, birth country ≠ primary citizenship: {len(immigrants)} ({100*len(immigrants)/max(1,len(merged)):.0f}%)")
print()
print("Top migration flows (birth country → citizenship):")
flows = immigrants.groupby(["country_label", "citizenship"]).size().sort_values(ascending=False).head(15)
for (src, dst), n in flows.items():
    print(f"  {src:<30} → {dst:<25}: {n}")

# ============================================================================
# Signal independence analysis (stress-test prediction)
# ============================================================================
print()
print("=== Signal correlation check (stress-test prediction) ===")
print("For sculptors included under Option A.2, which signals fire?")
for subset_name, subset in [
    ("All A.2 included",      new_included),
    ("Net new vs. old filter", new_included - published),
]:
    print(f"\n  {subset_name} ({len(subset)} sculptors):")
    n = len(subset)
    for sig_name, sig_set in [
        ("movement",         has_movement),
        ("edge",             has_edge),
        ("focus",            has_focus),
        ("multi-citz",       has_multi_citz),
        ("authority",        has_authority),
        ("multi-lang wiki",  qualifying_qids),
    ]:
        fired = len(subset & sig_set)
        pct = 100 * fired / max(1, n)
        print(f"    {sig_name:<18} {fired:>5}  ({pct:.0f}%)")
