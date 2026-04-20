"""Ramp the non-English sitelinks requirement and observe impact.

Tests the hypothesis: requiring MORE non-English Wikipedia articles is the
strongest anti-Western-bias signal. As we ramp from 1 to N non-EN, how does
the inclusion set and regional breakdown change?
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


sl_per = sitelinks.groupby("qid_clean")["lang"].agg(list)

def sitelinks_set(min_non_en: int) -> set[str]:
    def ok(langs):
        return sum(1 for l in langs if l != "en") >= min_non_en
    return set(sl_per[sl_per.apply(ok)].index) & all_qids


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

print("=" * 80)
print("NON-ENGLISH SITELINKS RAMP (A.3: M+E+F+multi_citz+sitelinks)")
print("=" * 80)
print(f"\nBase signals (no sitelinks): {len(base_signals)} sculptors")
print()
print(f"{'non-EN threshold':<20} {'SL set':>8} {'Total A.3':>10} {'%Cache':>8} {'%West':>7} {'NonW':>6} {'Female%':>9}")
print("-" * 78)

gender_map = dict(zip(nodes["qid_clean"], nodes["gender"]))

rows = []
for n in [1, 2, 3, 4, 5, 7, 10, 15, 20]:
    s = sitelinks_set(n)
    included = base_signals | s
    regs = pd.Series([region(q) for q in included]).value_counts(normalize=True)
    non_west = {c: len(nonwest_qids[c] & included) for c in NON_WESTERN_KEY}
    gen = pd.Series([gender_map.get(q, "unknown") for q in included]).value_counts(normalize=True)
    print(f"\u2265{n} non-EN langs          {len(s):>8} {len(included):>10} {100*len(included)/len(all_qids):>7.1f}% {100*regs.get('Western',0):>6.1f}% {sum(non_west.values()):>6} {100*gen.get('female',0):>8.1f}%")
    rows.append((n, non_west))

print("\n\nNon-Western country detail:\n")
print(f"{'Country':<16}", "  ".join(f"\u2265{n:>3} non-EN" for n, _ in rows))
for c in NON_WESTERN_KEY:
    if any(nw[c] > 0 for _, nw in rows):
        counts = [nw[c] for _, nw in rows]
        print(f"  {c:<14}", "  ".join(f"{n:>11}" for n in counts))
