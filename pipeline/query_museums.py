"""Query museum APIs (Met Museum + Art Institute of Chicago) for sculpture data."""
import time
from typing import Optional

import pandas as pd
import requests
from helpers import normalize_name
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


def _artist_matches(queried: str, museum_artist: str) -> bool:
    """Verify that a museum record's artist field corresponds to the
    sculptor we queried for.

    Both Met and AIC search endpoints, even with artist-restricted
    parameters, can return records where the artist field contains a
    different person whose name shares tokens with our query (e.g.
    "George Grey Barnard" surfacing on a search for "George Barnard").
    Without this check, we'd attribute the wrong sculptor's works.

    Strategy: require every token in the queried name to appear as a
    substring of the museum artist string after normalization. The
    queried name is the focus-list display form (we control it), so
    its token set is reasonable to demand exhaustively. The museum
    artist string can be much longer — "Auguste Rodin\\nFrench,
    1840-1917" or "Designed by X, made by Y" — so substring rather
    than equality is appropriate.
    """
    if not museum_artist:
        return False
    q_norm = normalize_name(queried)
    m_norm = normalize_name(museum_artist)
    if not q_norm or not m_norm:
        return False
    # Tokens of length >= 2 to ignore single-letter initials.
    q_tokens = [t for t in q_norm.split() if len(t) >= 2]
    if not q_tokens:
        return False
    return all(token in m_norm for token in q_tokens)


# =============================================================================
# Met Museum API
# =============================================================================

def search_met_by_artist(artist_name: str) -> list[int]:
    """Search Met Museum API for objects by artist name.
    
    Returns list of object IDs.
    """
    url = f"{MET_API_BASE}/search"
    # Met's `artistOrCulture=true` parameter looks like the right
    # restriction on paper, but in practice it returns 0 hits even for
    # major figures (q=Rodin&artistOrCulture=true → 0; q=Rodin alone →
    # 264). Empirically it requires an exact match against an internal
    # artist-name index that doesn't carry the forms we use.
    #
    # Without it, q= searches across all text fields including curator
    # notes and donor credits, which produces a long tail of false
    # positives (e.g. searching "Karl Bitter" returned pre-Columbian
    # works where he was a former owner). The defense is post-fetch:
    # _artist_matches() below verifies that the object's
    # artistDisplayName actually contains the queried sculptor's name
    # tokens, which is the source-of-truth field for attribution.
    params = {
        "q": artist_name,
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
        
        # Fetch details for each object. We cap per-artist to keep
        # the run bounded — Met's q= can return hundreds of results
        # (Rodin: 264), most of which won't survive the artist-match
        # check anyway. 50 is enough to capture an artist's notable
        # works while keeping total Met time under a minute.
        for obj_id in object_ids[:50]:
            obj_data = fetch_met_object(obj_id)
            
            if obj_data and obj_data.get("objectID"):
                # Filter to sculpture-class objects.
                #
                # Met's `classification` field is the right gate: values
                # are stable controlled-vocabulary strings like
                # "Sculpture", "Sculpture-Architectural",
                # "Drawings", etc. The earlier implementation checked
                # the `medium` field for the substring "sculpture",
                # but `medium` is the material text ("Bronze, marble
                # base") and almost never contains the word — which
                # silently dropped ~all Met results. Keeping
                # `objectName` as a secondary signal catches records
                # with no classification but explicit "Statue" /
                # "Bust" / "Relief" naming.
                classification = (obj_data.get("classification") or "").lower()
                object_name = (obj_data.get("objectName") or "").lower()
                medium = obj_data.get("medium", "")
                is_sculpture = (
                    "sculpture" in classification
                    or any(
                        kw in object_name
                        for kw in ("statue", "bust", "relief", "figurine", "sculpt")
                    )
                )
                # Verify the object's artist actually matches our queried
                # sculptor (artistOrCulture restricts the search, but the
                # object detail is the source of truth on attribution).
                artist_field = obj_data.get("artistDisplayName") or ""
                if is_sculpture and _artist_matches(name, artist_field):
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
                        # IIIF image fields — captured even when not
                        # public-domain, so the export step has the
                        # full picture and can apply its own filter.
                        "is_public_domain": bool(obj_data.get("isPublicDomain", False)),
                        "image_url": obj_data.get("primaryImage", "") or "",
                        "thumbnail_url": obj_data.get("primaryImageSmall", "") or "",
                        "museum_url": obj_data.get("objectURL", "") or "",
                        "credit_line": obj_data.get("creditLine", "") or "",
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
        # `image_id` is the UUID we stitch into AIC's IIIF endpoint to
        # render at any size. `is_public_domain` is the strict gate for
        # the works gallery. `thumbnail` carries lqip + dimensions used
        # for blur-up placeholders if we ever want them.
        "fields": ",".join([
            "id",
            "title",
            "artist_display",
            "date_display",
            "medium_display",
            "artwork_type_title",
            "image_id",
            "is_public_domain",
            "thumbnail",
            "credit_line",
        ]),
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
            
            artist_field = artwork.get("artist_display") or ""
            if (
                any(s.lower() in artwork_type.lower() for s in sculpture_types)
                and _artist_matches(name, artist_field)
            ):
                aic_id = artwork.get("id")
                image_id = artwork.get("image_id") or ""
                # AIC's IIIF endpoint is documented at
                # https://api.artic.edu/docs/#iiif-image-api. 843px is
                # the recommended display width per their guidance.
                image_url = (
                    f"https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg"
                    if image_id
                    else ""
                )
                thumb_url = (
                    f"https://www.artic.edu/iiif/2/{image_id}/full/200,/0/default.jpg"
                    if image_id
                    else ""
                )
                museum_url = (
                    f"https://www.artic.edu/artworks/{aic_id}" if aic_id else ""
                )
                records.append({
                    "source": "aic",
                    "sculptor_name": name,
                    "object_id": str(aic_id) if aic_id is not None else "",
                    "title": artwork.get("title", ""),
                    "medium": artwork.get("medium_display", ""),
                    "date": artwork.get("date_display", ""),
                    "begin_year": None,
                    "end_year": None,
                    "culture": "",
                    "department": artwork_type,
                    "is_public_domain": bool(artwork.get("is_public_domain", False)),
                    "image_url": image_url,
                    "thumbnail_url": thumb_url,
                    "museum_url": museum_url,
                    "credit_line": artwork.get("credit_line", "") or "",
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
