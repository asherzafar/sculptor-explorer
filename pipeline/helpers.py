"""Core helper functions for SPARQL queries and data processing."""
import time
import unicodedata
from pathlib import Path
from typing import Optional

import pandas as pd
import requests
from config import (
    BATCH_DELAY_SECONDS,
    SPARQL_ENDPOINT,
    TIMEOUT_SECONDS,
    USER_AGENT,
)


def normalize_name(name: str) -> str:
    """Normalize a name for fuzzy matching: lowercase, strip diacritics, trim."""
    if not name:
        return ""
    # Convert to ASCII (remove diacritics)
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ASCII", "ignore").decode("ASCII")
    return ascii_name.lower().strip()


def build_values_block(qids: list[str], varname: str = "?qid") -> str:
    """Build a SPARQL VALUES clause from a list of QIDs.
    
    Returns string like "VALUES ?qid { wd:Q123 wd:Q456 }"
    """
    items = " ".join(f"wd:{qid}" for qid in qids)
    return f"VALUES {varname} {{ {items} }}"


def query_sparql(
    query: str,
    endpoint: str = SPARQL_ENDPOINT,
    cache_path: Optional[Path] = None,
    refresh: bool = True,
    max_attempts: int = 3,
    wait_seconds: tuple = (3, 10, 30),
) -> pd.DataFrame:
    """POST a SPARQL query to an endpoint and return a DataFrame.
    
    Retries with exponential backoff. Caches results as parquet.
    If cache exists and refresh = False, returns cached data without querying.
    """
    # Return cache if available and refresh not requested
    if cache_path is not None and not refresh and cache_path.exists():
        print(f"✓ Loading cached: {cache_path.name}")
        return pd.read_parquet(cache_path)
    
    last_error = None
    
    for attempt in range(1, max_attempts + 1):
        print(f"→ SPARQL attempt {attempt}/{max_attempts}", end="")
        if cache_path:
            print(f" ({cache_path.name})")
        else:
            print()
        
        try:
            headers = {
                "Content-Type": "application/sparql-query",
                "Accept": "text/csv",
                "User-Agent": USER_AGENT,
            }
            
            response = requests.post(
                endpoint,
                data=query.encode("utf-8"),
                headers=headers,
                timeout=TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            
            # Parse CSV response
            from io import StringIO
            df = pd.read_csv(StringIO(response.text), dtype=str)
            
            # Defensive: strip '?' from headers if endpoint doesn't conform to spec
            df.columns = [col.lstrip("?") for col in df.columns]
            
            # Cache if path provided
            if cache_path is not None:
                df.to_parquet(cache_path, index=False)
                print(f"✓ Cached: {cache_path.name} ({len(df)} rows)")
            
            return df
            
        except Exception as e:
            last_error = e
            print(f"✗ Attempt {attempt} failed: {e}")
            
            if attempt < max_attempts:
                wait = wait_seconds[min(attempt - 1, len(wait_seconds) - 1)]
                print(f"  Waiting {wait}s before retry...")
                time.sleep(wait)
    
    raise RuntimeError(
        f"SPARQL query failed after {max_attempts} attempts.\n"
        f"Last error: {last_error}\n"
        f"Endpoint: {endpoint}"
    )


def query_sparql_batched(
    query_template: str,
    qids: list[str],
    endpoint: str = SPARQL_ENDPOINT,
    cache_path: Optional[Path] = None,
    refresh: bool = True,
    batch_size: int = 300,
) -> pd.DataFrame:
    """Run a query in batches over a QID list, binding results.
    
    Failed batches are skipped with a warning (not fatal).
    """
    # Return cache if available
    if cache_path is not None and not refresh and cache_path.exists():
        print(f"✓ Loading cached: {cache_path.name}")
        return pd.read_parquet(cache_path)
    
    # Split into batches
    batches = [
        qids[i : i + batch_size] for i in range(0, len(qids), batch_size)
    ]
    print(f"→ Running {len(batches)} batch(es) of up to {batch_size} QIDs each")
    
    t0 = time.time()
    results = []
    failed_batches = []
    
    for i, batch_qids in enumerate(batches, 1):
        values_block = build_values_block(batch_qids)
        query = query_template.replace("{{VALUES_BLOCK}}", values_block)
        print(f"  Batch {i}/{len(batches)} ({len(batch_qids)} QIDs)")
        
        try:
            result = query_sparql(
                query,
                endpoint=endpoint,
                cache_path=None,  # Don't cache individual batches
                refresh=True,
            )
            results.append(result)
        except Exception as e:
            print(f"  ⚠ Batch {i} failed: {e}")
            failed_batches.append(i)
        
        # Be a good citizen: small delay between batches on public endpoints
        if i < len(batches):
            time.sleep(BATCH_DELAY_SECONDS)
    
    elapsed = round(time.time() - t0, 1)
    print(f"  Completed in {elapsed}s")
    
    if not results:
        raise RuntimeError("All batches returned zero rows. Check query and endpoint.")
    
    df = pd.concat(results, ignore_index=True)
    
    if cache_path is not None:
        df.to_parquet(cache_path, index=False)
        print(f"✓ Cached: {cache_path.name} ({len(df)} rows)")
    
    if failed_batches:
        print(f"⚠ Failed batches: {failed_batches}")
    
    return df
