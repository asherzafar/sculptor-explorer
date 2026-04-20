"""Deep analysis of inclusion signal correlation, coverage, and bias.

Answers:
  1. How do the 6 signals correlate (Jaccard overlap matrix)?
  2. Who does each signal "hit"? (region/gender/era profile per signal)
  3. What do different permutations produce? (size + non-Western preservation)

Data inputs come from the enrichment cache. No new queries.
"""
from __future__ import annotations

import json
import pandas as pd
from itertools import combinations

sitelinks    = pd.read_parquet("../data/raw/sculptor_sitelinks_1800plus.parquet")
authorities  = pd.read_parquet("../data/raw/sculptor_authority_ids_1800plus.parquet")
nodes        = pd.read_parquet("../data/raw/sculptor_nodes_raw_1800plus.parquet")
movements    = pd.read_parquet("../data/raw/sculptor_movements_1800plus.parquet")
citz         = pd.read_parquet("../data/raw/sculptor_citizenships_1800plus.parquet")
relations    = pd.read_parquet("../data/raw/sculptor_relations_1800plus.parquet")

with open("../web/public/data/focus_sculptors.json") as f:
    focus_qids = {s["qid"] for s in json.load(f)}

all_qids = set(nodes["qid_clean"])

# ============================================================================
# Build signal sets
# ============================================================================
has_movement = set(movements["qid_clean"]) & all_qids
has_edge     = (set(relations["to_qid"]) | set(relations["from_qid"])) & all_qids
has_focus    = focus_qids & all_qids
per_c        = citz.groupby("qid_clean").size()
has_multi_c  = set(per_c[per_c >= 2].index) & all_qids
has_authority = set(authorities["qid_clean"]) & all_qids
sl_per = sitelinks.groupby("qid_clean")["lang"].agg(list)
has_sitelinks = set(sl_per[sl_per.apply(lambda ls: len(ls) >= 2 and any(l != "en" for l in ls))].index) & all_qids

SIGNALS = {
    "movement":   has_movement,
    "edge":       has_edge,
    "focus":      has_focus,
    "multi_citz": has_multi_c,
    "authority":  has_authority,
    "sitelinks":  has_sitelinks,
}

# ============================================================================
# Demographics
# ============================================================================
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
# Primary citizenship = most-repeated or first
first_c = citz.groupby("qid_clean")["citizenshipLabel"].first()
def region(qid):
    c = first_c.get(qid)
    if pd.isna(c) or c is None: return "unknown"
    return "Western" if c in WESTERN else "Non-Western"

# Era = decade of birth
node_birth = dict(zip(nodes["qid_clean"], nodes["birth"]))
def decade(qid):
    b = node_birth.get(qid)
    if not b or pd.isna(b): return "unknown"
    try:
        y = int(str(b)[:4])
        return f"{(y//10)*10}s"
    except Exception:
        return "unknown"

gender_map = dict(zip(nodes["qid_clean"], nodes["gender"]))


# ============================================================================
# (1) Pairwise overlap — Jaccard and conditional
# ============================================================================
print("=" * 72)
print("1. SIGNAL OVERLAP MATRIX")
print("=" * 72)
print("\nJaccard similarity (|A∩B| / |A∪B|):\n")
names = list(SIGNALS.keys())
header = "             " + "  ".join(f"{n:>10}" for n in names)
print(header)
for a in names:
    row = [f"{a:<12}"]
    A = SIGNALS[a]
    for b in names:
        B = SIGNALS[b]
        j = len(A & B) / max(1, len(A | B))
        row.append(f"{j:>10.2f}")
    print("  ".join(row))

print("\nP(B | A) — if a sculptor fires A, how often does B also fire?:\n")
print(header)
for a in names:
    row = [f"{a:<12}"]
    A = SIGNALS[a]
    for b in names:
        B = SIGNALS[b]
        p = len(A & B) / max(1, len(A))
        row.append(f"{p:>10.2f}")
    print("  ".join(row))

# ============================================================================
# (2) Who does each signal uniquely "hit"?
# Profile: region/gender/decade for sculptors who ONLY pass via signal X
# ============================================================================
print("\n" + "=" * 72)
print("2. DEMOGRAPHIC PROFILE PER SIGNAL")
print("=" * 72)

def profile(label, subset):
    n = len(subset)
    if n == 0:
        print(f"\n{label}: (empty)")
        return
    regions = pd.Series([region(q) for q in subset]).value_counts(normalize=True)
    genders = pd.Series([gender_map.get(q, "unknown") for q in subset]).value_counts(normalize=True)
    decades = pd.Series([decade(q) for q in subset]).value_counts().head(5)
    print(f"\n{label} ({n} sculptors)")
    print(f"  Region:  Western {100*regions.get('Western',0):.0f}%  |  Non-Western {100*regions.get('Non-Western',0):.0f}%  |  unknown {100*regions.get('unknown',0):.0f}%")
    print(f"  Gender:  male {100*genders.get('male',0):.0f}%  |  female {100*genders.get('female',0):.0f}%  |  other {100*genders.drop(['male','female'], errors='ignore').sum():.2f}%")
    top_decades = ", ".join([f"{d}:{n}" for d,n in decades.items()])
    print(f"  Top decades: {top_decades}")

print("\n--- Full signal sets ---")
for name, s in SIGNALS.items():
    profile(f"Signal: {name}", s)

# Who does EACH signal UNIQUELY include (i.e., excluded by other 5, included by this one)?
print("\n\n--- Unique contribution (only this signal fires) ---")
for name, s in SIGNALS.items():
    others = set().union(*[v for k, v in SIGNALS.items() if k != name])
    unique = s - others
    profile(f"Only {name}", unique)

# ============================================================================
# (3) Permutations — how does set look under different signal stacks?
# ============================================================================
print("\n" + "=" * 72)
print("3. PERMUTATION ANALYSIS")
print("=" * 72)

NON_WESTERN_KEY = [
    "Japan", "Mexico", "Brazil", "Argentina", "Turkey", "Iran", "India",
    "South Korea", "China", "Chile", "Colombia", "Peru", "Nigeria",
    "South Africa", "Indonesia", "Ghana", "Egypt", "Philippines", "Vietnam",
    "Morocco",
]
# QIDs by non-Western country
nonwest_qids = {}
for c in NON_WESTERN_KEY:
    nonwest_qids[c] = set(citz[citz["citizenshipLabel"] == c]["qid_clean"])

def evaluate(combo_names):
    included = set()
    for name in combo_names:
        included |= SIGNALS[name]
    # Regional breakdown
    regions = pd.Series([region(q) for q in included]).value_counts(normalize=True)
    # Non-Western country coverage
    non_west_totals = {c: len(nonwest_qids[c] & included) for c in NON_WESTERN_KEY}
    return {
        "size": len(included),
        "pct_cache": 100 * len(included) / len(all_qids),
        "pct_western": 100 * regions.get("Western", 0),
        "pct_non_western": 100 * regions.get("Non-Western", 0),
        "non_west_sum": sum(non_west_totals.values()),
        "non_west_by_country": non_west_totals,
    }

# Test permutations
PERMUTATIONS = [
    ("Current (M+E+F)", ["movement", "edge", "focus"]),
    ("+ multi_citz", ["movement", "edge", "focus", "multi_citz"]),
    ("+ sitelinks (A.2 minus authority)", ["movement", "edge", "focus", "multi_citz", "sitelinks"]),
    ("+ authority (A.2 minus sitelinks)", ["movement", "edge", "focus", "multi_citz", "authority"]),
    ("Full A.2 (all 6)", ["movement", "edge", "focus", "multi_citz", "authority", "sitelinks"]),
    ("A.2 minus multi_citz", ["movement", "edge", "focus", "authority", "sitelinks"]),
    ("Sitelinks only (stress test)", ["sitelinks"]),
    ("Authority only (stress test)", ["authority"]),
    ("Authority AND sitelinks required", None),  # special: intersection
    ("M+E+F+multi_citz only", ["movement", "edge", "focus", "multi_citz"]),
]

results = []
for label, combo in PERMUTATIONS:
    if combo is None:
        # special: intersection
        included = SIGNALS["authority"] & SIGNALS["sitelinks"]
        regions = pd.Series([region(q) for q in included]).value_counts(normalize=True)
        non_west_totals = {c: len(nonwest_qids[c] & included) for c in NON_WESTERN_KEY}
        r = {
            "size": len(included),
            "pct_cache": 100 * len(included) / len(all_qids),
            "pct_western": 100 * regions.get("Western", 0),
            "pct_non_western": 100 * regions.get("Non-Western", 0),
            "non_west_sum": sum(non_west_totals.values()),
            "non_west_by_country": non_west_totals,
        }
    else:
        r = evaluate(combo)
    r["label"] = label
    results.append(r)

print(f"\n{'Permutation':<40} {'Size':>6} {'%Cache':>7} {'%West':>6} {'%NonW':>6} {'NonW cnt':>9}")
print("-" * 76)
for r in results:
    print(f"{r['label']:<40} {r['size']:>6} {r['pct_cache']:>6.1f}% {r['pct_western']:>5.1f}% {r['pct_non_western']:>5.1f}% {r['non_west_sum']:>9}")

# Detailed non-western view for top 3 candidates
print("\n\nDetailed non-Western country coverage (selected permutations):\n")
selected = ["Current (M+E+F)", "M+E+F+multi_citz only", "+ sitelinks (A.2 minus authority)", "Full A.2 (all 6)"]
selected_results = [r for r in results if r["label"] in selected]
countries_to_show = [c for c in NON_WESTERN_KEY if any(r["non_west_by_country"][c] > 0 for r in selected_results)]
print(f"{'Country':<20}", "  ".join(f"{s:>25}" for s in selected))
for c in countries_to_show:
    counts = [r["non_west_by_country"][c] for r in selected_results]
    print(f"  {c:<18}", "  ".join(f"{n:>25}" for n in counts))
