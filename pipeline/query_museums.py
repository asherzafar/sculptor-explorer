"""Query museum APIs (Met Museum + Art Institute of Chicago) for sculpture data."""
import time
from typing import Optional

import pandas as pd
import requests
from config import (
    MET_API_BASE,
    AIC_API_BASE,
    MET_RATE_LIMIT,
    AIC_RATE_LIMIT,
    MET_OBJECTS_CACHE_PATH,
    AIC_OBJECTS_CACHE_PATH,
    REFRESH_FROM_MET,
    REFRESH_FROM_AIC,
    USER_AGENT,
    TIMEOUT_SECONDS,
)


# =============================================================================
# Met Museum API
# =============================================================================

def search_met_by_artist(artist_name: str) -> list[int]:
    """Search Met Museum API for objects by artist name.
    
    Returns list of object IDs.
    """
    url = f"{MET_API_BASE}/search"
    params = {
        "q": artist_name,
        "medium": "Sculpture",  # Filter to sculpture medium
    }
    headers = {"User-Agent": USER_AGENT}
    
    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("objectIDs", []) or []
    except Exception as e:
        print(f"  ⚠ Met search failed for '{artist_name}': {e}")
        return []


def fetch_met_object(object_id: int) -> Optional[dict]:
    """Fetch a single Met Museum object by ID."""
    url = f"{MET_API_BASE}/objects/{object_id}"
    headers = {"User-Agent": USER_AGENT}
    
    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ⚠ Failed to fetch Met object {object_id}: {e}")
        return None


def query_met_for_sculptors(sculptor_names: list[str]) -> pd.DataFrame:
    """Query Met Museum API for a list of sculptors.
    
    For each sculptor, search by name and fetch object details.
    """
    if not REFRESH_FROM_MET and MET_OBJECTS_CACHE_PATH.exists():
        print("✓ Loading cached Met objects")
        return pd.read_parquet(MET_OBJECTS_CACHE_PATH)
    
    records = []
    
    for i, name in enumerate(sculptor_names, 1):
        print(f"  [{i}/{len(sculptor_names)}] Searching Met for: {name}")
        
        # Search for objects by this artist
        object_ids = search_met_by_artist(name)
        
        if not object_ids:
            time.sleep(MET_RATE_LIMIT)
            continue
        
        print(f"    Found {len(object_ids)} objects")
        
        # Fetch details for each object (limit to first 20 to be nice to the API)
        for obj_id in object_ids[:20]:
            obj_data = fetch_met_object(obj_id)
            
            if obj_data and obj_data.get("objectID"):
                # Check if it's actually a sculpture
                medium = obj_data.get("medium", "")
                if medium and ("sculpture" in medium.lower() or "sculptor" in medium.lower()):
                    records.append({
                        "source": "met",
                        "sculptor_name": name,
                        "object_id": str(obj_data.get("objectID")),
                        "title": obj_data.get("title", ""),
                        "medium": medium,
                        "date": obj_data.get("objectDate", ""),
                        "begin_year": obj_data.get("objectBeginDate"),
                        "end_year": obj_data.get("objectEndDate"),
                        "culture": obj_data.get("culture", ""),
                        "department": obj_data.get("department", ""),
                    })
            
            time.sleep(MET_RATE_LIMIT)
        
        time.sleep(MET_RATE_LIMIT)
    
    df = pd.DataFrame(records)
    if len(df) > 0:
        df.to_parquet(MET_OBJECTS_CACHE_PATH, index=False)
        print(f"✓ Cached {len(df)} Met objects")
    else:
        print("⚠ No Met objects found")
    
    return df


# =============================================================================
# Art Institute of Chicago API
# =============================================================================

def search_aic_by_artist(artist_name: str) -> list[dict]:
    """Search AIC API for artworks by artist name.
    
    Returns list of artwork records.
    """
    url = f"{AIC_API_BASE}/artworks/search"
    params = {
        "q": artist_name,
        "fields": "id,title,artist_display,date_display,medium_display,artwork_type_title",
        "limit": 20,
    }
    headers = {"User-Agent": USER_AGENT}
    
    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])
    except Exception as e:
        print(f"  ⚠ AIC search failed for '{artist_name}': {e}")
        return []


def query_aic_for_sculptors(sculptor_names: list[str]) -> pd.DataFrame:
    """Query AIC API for a list of sculptors."""
    if not REFRESH_FROM_AIC and AIC_OBJECTS_CACHE_PATH.exists():
        print("✓ Loading cached AIC objects")
        return pd.read_parquet(AIC_OBJECTS_CACHE_PATH)
    
    records = []
    
    for i, name in enumerate(sculptor_names, 1):
        print(f"  [{i}/{len(sculptor_names)}] Searching AIC for: {name}")
        
        # Search for artworks by this artist
        artworks = search_aic_by_artist(name)
        
        if not artworks:
            time.sleep(AIC_RATE_LIMIT)
            continue
        
        print(f"    Found {len(artworks)} artworks")
        
        # Filter to sculpture types
        sculpture_types = ["Sculpture", "sculpture", "Statue", "statue", "Relief", "relief", "Model", "model"]
        
        for artwork in artworks:
            artwork_type = artwork.get("artwork_type_title", "")
            
            if any(s.lower() in artwork_type.lower() for s in sculpture_types):
                records.append({
                    "source": "aic",
                    "sculptor_name": name,
                    "object_id": str(artwork.get("id")),
                    "title": artwork.get("title", ""),
                    "medium": artwork.get("medium_display", ""),
                    "date": artwork.get("date_display", ""),
                    "begin_year": None,
                    "end_year": None,
                    "culture": "",
                    "department": artwork_type,
                })
        
        time.sleep(AIC_RATE_LIMIT)
    
    df = pd.DataFrame(records)
    if len(df) > 0:
        df.to_parquet(AIC_OBJECTS_CACHE_PATH, index=False)
        print(f"✓ Cached {len(df)} AIC objects")
    else:
        print("⚠ No AIC objects found")
    
    return df


# =============================================================================
# Main entry point
# =============================================================================

def run_museum_queries(sculptor_names: list[str]) -> dict:
    """Run all museum API queries."""
    print("=" * 60)
    print("Querying Met Museum API")
    print("=" * 60)
    met_data = query_met_for_sculptors(sculptor_names)
    
    print("\n" + "=" * 60)
    print("Querying Art Institute of Chicago API")
    print("=" * 60)
    aic_data = query_aic_for_sculptors(sculptor_names)
    
    # Combine
    combined = pd.concat([met_data, aic_data], ignore_index=True)
    
    print(f"\n✓ Total museum objects: {len(combined)}")
    print(f"  - Met: {len(met_data)}")
    print(f"  - AIC: {len(aic_data)}")
    
    return {
        "met": met_data,
        "aic": aic_data,
        "combined": combined,
    }


if __name__ == "__main__":
    # For testing, use focus sculptors
    from config import FOCUS_SCULPTOR_NAMES
    run_museum_queries(FOCUS_SCULPTOR_NAMES)
