"""Configuration for the sculptor data pipeline."""
import csv
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_CACHE_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
WEB_DATA_DIR = PROJECT_ROOT / "web" / "public" / "data"
OVERRIDES_DIR = PROJECT_ROOT / "overrides"

# Ensure directories exist
for d in [RAW_CACHE_DIR, PROCESSED_DIR, WEB_DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# SPARQL endpoint
SPARQL_ENDPOINT = "https://qlever.cs.uni-freiburg.de/api/wikidata"

# Pipeline settings
MIN_BIRTH_YEAR = 1800
VALUES_BATCH_SIZE = 300
REFRESH_FROM_WIKIDATA = True
REFRESH_PROCESSING = True

# HTTP settings
TIMEOUT_SECONDS = 300
USER_AGENT = "SculptorExplorer/1.0 (Python/requests)"
BATCH_DELAY_SECONDS = 0.5

# Museum API settings
MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
AIC_API_BASE = "https://api.artic.edu/api/v1"
MET_RATE_LIMIT = 0.0125  # ~80 req/sec = 0.0125 sec between requests
AIC_RATE_LIMIT = 1.0     # 1 req/sec recommended

# Refresh flags for museum APIs
REFRESH_FROM_MET = True
REFRESH_FROM_AIC = True

# Canonical focus sculptor list — single source of truth
# Edit overrides/focus_sculptors.csv to add/remove sculptors.
FOCUS_SCULPTORS_CSV = OVERRIDES_DIR / "focus_sculptors.csv"


def load_focus_sculptors() -> list[dict]:
    """Load the canonical focus sculptor list from CSV."""
    with open(FOCUS_SCULPTORS_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# Convenience: flat list of names for pipeline matching
FOCUS_SCULPTOR_NAMES: list[str] = [
    row["name"] for row in load_focus_sculptors()
]

# Cache file paths (as parquet)
def raw_cache_path(name: str) -> Path:
    return RAW_CACHE_DIR / f"{name}_{MIN_BIRTH_YEAR}plus.parquet"

def processed_cache_path(name: str) -> Path:
    return PROCESSED_DIR / f"{name}_{MIN_BIRTH_YEAR}plus.parquet"

# Specific cache paths
QID_CACHE_PATH = raw_cache_path("sculptor_qids")
NODES_RAW_CACHE_PATH = raw_cache_path("sculptor_nodes_raw")
MOVEMENTS_CACHE_PATH = raw_cache_path("sculptor_movements")
CITIZENSHIPS_CACHE_PATH = raw_cache_path("sculptor_citizenships")
RELATIONS_CACHE_PATH = raw_cache_path("sculptor_relations")
MET_OBJECTS_CACHE_PATH = raw_cache_path("met_objects")
AIC_OBJECTS_CACHE_PATH = raw_cache_path("aic_objects")
NODES_ENRICHED_PATH = processed_cache_path("sculptor_nodes_enriched")
NODES_METRICS_PATH = processed_cache_path("sculptor_nodes_metrics")
RELATIONS_CLEAN_PATH = processed_cache_path("sculptor_relations_clean")
MATERIALS_BY_DECADE_PATH = processed_cache_path("materials_by_decade")
