"""Analyze how the sitelinks threshold affects the A.3 inclusion set.

Compare these sitelinks rules:
  - \u22652 languages, \u22651 non-English (current)
  - \u22653 languages, \u22651 non-English
  - \u22654 languages, \u22651 non-English
  - \u22655 languages, \u22651 non-English
  - \u22652 languages, \u22652 non-English (stricter diversity)
  - \u22653 languages, \u22652 non-English
"""
from __future__ import annotations

import json
import pandas as pd

sitelinks  = pd.read_parquet("../data/raw/sculptor_sitelinks_1800plus.parquet")
nodes      = pd.read_parquet("../data/raw/sculptor_nodes_raw_1800plus.parquet")
movements  = pd.read_parquet("../data/raw/sculptor_movements_1800plus.parquet")
citz       = pd.read_parquet("../data/raw/sculptor_citizenships_1800plus.parquet")
relations  = pd.read_parquet("../data/raw/sculptor_relations_1800plus.parquet")

with open("../web/public/data/focus_sculptors.json") as f:
    focus_qids = {s["qid"] for s in json.load(f)}

all_qids = set(nodes["qid_clean"])

WESTERN = {
    "France", "Germany", "United States", "United Kingdom",
    "Kingdom of the Netherlands", "Netherlands", "Austria", "Hungary",
    "Italy", "Kingdom of Italy", "Switzerland", "Belgium", "German Reich",
    "Spain", "Canada", "Poland", "Czech Republic", "Denmark",
    "Kingdom of Denmark", "Sweden", "Kingdom of Sweden", "Norway",
    "Finland", "Ireland", "Portugal", "Greece", "Australia", "New Zealand",
    "Russian Empire", "Russia", "Kingdom of Prussia", "German Empire",
    "German Democratic Republic", "Austria\u2013Hungary", "Czechoslovakia",
    "Yugoslavia", "Soviet Union", "Kingdom of Great Britain",
    "United Kingdom of Great Britain and Ireland", "Socialist Federal Republic of Yugoslavia",
    "Kingdom of Hungary", "Estonia", "Latvia", "Lithuania", "Slovakia",
    "Slovenia", "Croatia", "Bulgaria", "Romania", "Ukraine", "Belarus",
    "Serbia", "Bosnia and Herzegovina", "Moldova", "Iceland", "Luxembourg",
    "Liechtenstein", "Malta", "Monaco", "San Marino",
}
first_c = citz.groupby("qid_clean")["citizenshipLabel"].first()
def region(qid):
    c = first_c.get(qid)
    if pd.isna(c) or c is None: return "unknown"
    return "Western" if c in WESTERN else "Non-Western"


# Pre-compute language lists per sculptor
sl_per = sitelinks.groupby("qid_clean")["lang"].agg(list)


def sitelinks_set(min_total: int, min_non_english: int) -> set[str]:
    def ok(langs):
        if len(langs) < min_total:
            return False
        n_non_en = sum(1 for l in langs if l != "en")
        return n_non_en >= min_non_english
    return set(sl_per[sl_per.apply(ok)].index) & all_qids


# Non-sitelinks signals (constant across threshold tests)
has_movement = set(movements["qid_clean"]) & all_qids
has_edge     = (set(relations["to_qid"]) | set(relations["from_qid"])) & all_qids
has_focus    = focus_qids & all_qids
per_c        = citz.groupby("qid_clean").size()
has_multi_c  = set(per_c[per_c >= 2].index) & all_qids
base_signals = has_movement | has_edge | has_focus | has_multi_c

NON_WESTERN_KEY = [
    "Japan", "Mexico", "Brazil", "Argentina", "Turkey", "Iran", "India",
    "South Korea", "China", "Chile", "Colombia", "Peru", "Nigeria",
    "South Africa", "Indonesia", "Ghana", "Egypt", "Philippines", "Vietnam",
    "Morocco",
]
nonwest_qids = {c: set(citz[citz["citizenshipLabel"] == c]["qid_clean"]) for c in NON_WESTERN_KEY}


def evaluate(sitelinks_rule_label: str, sitelinks_set_: set[str]):
    included = base_signals | sitelinks_set_
    regions = pd.Series([region(q) for q in included]).value_counts(normalize=True)
    non_west = {c: len(nonwest_qids[c] & included) for c in NON_WESTERN_KEY}
    return {
        "label": sitelinks_rule_label,
        "sitelinks_only": len(sitelinks_set_),
        "total": len(included),
        "pct_cache": 100 * len(included) / len(all_qids),
        "pct_western": 100 * regions.get("Western", 0),
        "non_west_sum": sum(non_west.values()),
        "non_west": non_west,
    }


rules = [
    ("\u22652 langs, \u22651 non-EN",  sitelinks_set(2, 1)),
    ("\u22653 langs, \u22651 non-EN",  sitelinks_set(3, 1)),
    ("\u22654 langs, \u22651 non-EN",  sitelinks_set(4, 1)),
    ("\u22655 langs, \u22651 non-EN",  sitelinks_set(5, 1)),
    ("\u22652 langs, \u22652 non-EN",  sitelinks_set(2, 2)),
    ("\u22653 langs, \u22652 non-EN",  sitelinks_set(3, 2)),
    ("\u22655 langs, \u22653 non-EN",  sitelinks_set(5, 3)),
]

results = [evaluate(label, s) for label, s in rules]

print("=" * 80)
print("SITELINKS THRESHOLD VARIATIONS (with A.3 base signals M+E+F+multi_citz)")
print("=" * 80)
print(f"\nBase signals (no sitelinks): {len(base_signals)} sculptors")
print()
print(f"{'Sitelinks rule':<25} {'SL set':>8} {'Total A.3':>10} {'%Cache':>8} {'%West':>7} {'NonW':>6}")
print("-" * 72)
for r in results:
    print(f"{r['label']:<25} {r['sitelinks_only']:>8} {r['total']:>10} {r['pct_cache']:>7.1f}% {r['pct_western']:>6.1f}% {r['non_west_sum']:>6}")

# Non-Western country detail for top few
print("\n\nNon-Western coverage per threshold:\n")
top_countries = [c for c in NON_WESTERN_KEY if nonwest_qids[c]]
selected_idx = [0, 1, 2, 3, 4, 5]  # show all variations
print(f"{'Country':<18}", "  ".join(f"{rules[i][0]:>22}" for i in selected_idx))
for c in top_countries:
    counts = [results[i]["non_west"][c] for i in selected_idx]
    print(f"  {c:<16}", "  ".join(f"{n:>22}" for n in counts))

# Women/gender preservation
print("\n\nGender preservation under each threshold:")
gender_map = dict(zip(nodes["qid_clean"], nodes["gender"]))
for r_idx, r in enumerate(results):
    included = base_signals | rules[r_idx][1]
    g = pd.Series([gender_map.get(q, "unknown") for q in included]).value_counts(normalize=True)
    print(f"  {r['label']:<25} male {100*g.get('male',0):.1f}%   female {100*g.get('female',0):.1f}%   other/unknown {100*g.drop(['male','female'], errors='ignore').sum():.2f}%")
