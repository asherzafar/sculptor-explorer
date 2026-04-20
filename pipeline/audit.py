"""One-off analytical audit of the existing pipeline cache.

Not part of the pipeline. Used to inform Phase 3 direction.
"""
import pandas as pd
import json

nodes = pd.read_parquet("../data/raw/sculptor_nodes_raw_1800plus.parquet")
citz = pd.read_parquet("../data/raw/sculptor_citizenships_1800plus.parquet")
movs = pd.read_parquet("../data/raw/sculptor_movements_1800plus.parquet")
rels = pd.read_parquet("../data/raw/sculptor_relations_1800plus.parquet")

with open("../web/public/data/sculptors.json") as f:
    published = {s["qid"] for s in json.load(f)}

total = len(nodes)
has_movement = set(movs["qid_clean"])
has_edge = set(rels["to_qid"]) | set(rels["from_qid"])

dropped = nodes[~nodes["qid_clean"].isin(published)]
print(f"Total sculptors: {total}")
print(f"Published to web: {len(published)} ({100*len(published)/total:.1f}%)")
print(f"Dropped: {len(dropped)} ({100*len(dropped)/total:.1f}%)")
print()

print("=== DROPPED sculptors: what they look like ===")
dropped_qids = set(dropped["qid_clean"])
dropped_citz = citz[citz["qid_clean"].isin(dropped_qids)]
print("Top citizenships among dropped:")
for country, count in dropped_citz["citizenshipLabel"].value_counts().head(15).items():
    print(f"  {country}: {count}")
print()

print(f"Dropped with any citizenship data: {dropped_citz['qid_clean'].nunique()}")
print(f"Dropped with edge: {len(dropped_qids & has_edge)}")
print(f"Dropped with movement: {len(dropped_qids & has_movement)}")
print()

print("=== Non-Western presence in dropped set ===")
non_western = [
    "Japan", "China", "Republic of Korea", "South Korea", "India",
    "Nigeria", "Kenya", "South Africa", "Brazil", "Mexico",
    "Argentina", "Chile", "Peru", "Colombia", "Egypt",
    "Turkey", "Iran", "Indonesia", "Philippines", "Vietnam",
    "Ghana", "Senegal", "Ethiopia", "Morocco", "Lebanon",
]
for c in non_western:
    n_total = citz[citz["citizenshipLabel"] == c]["qid_clean"].nunique()
    n_dropped = dropped_citz[dropped_citz["citizenshipLabel"] == c]["qid_clean"].nunique()
    if n_total > 0:
        print(f"  {c}: {n_total} total, {n_dropped} dropped ({100*n_dropped/n_total:.0f}%)")

print()
print("=== Multi-citizenship delta stats ===")
per = citz.groupby("qid_clean").size()
multi = per[per > 1]
print(f"Sculptors with >1 citizenship: {len(multi)}")
print(f"Among those, how many are published vs dropped?")
multi_pub = multi.index.isin(published).sum()
print(f"  Published: {multi_pub}")
print(f"  Dropped: {len(multi) - multi_pub}")
