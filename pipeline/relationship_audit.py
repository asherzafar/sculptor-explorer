"""Shared temporal and transparency helpers for relationship exports.

This module deliberately has no pandas dependency. The primary pipeline
uses it while exporting fresh data, and ``backfill_relationship_exports``
uses the same functions to upgrade an already-committed static snapshot
when the parquet caches are unavailable in a worktree.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Mapping
from typing import Any

from temporal import (
    STUDENT_OF_AGE_PRIOR,
    NodeEnvelope,
    compute_envelope,
)


TEMPORAL_FIELDS = (
    "minStart",
    "maxStart",
    "minEnd",
    "maxEnd",
    "dateSource",
    "confidence",
)


def _int_or_none(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def build_person_envelopes(
    records: Iterable[Mapping[str, Any]],
) -> tuple[dict[str, NodeEnvelope], set[str]]:
    """Build QID-indexed lifespans from camel- or snake-case person rows.

    Records without a birth year cannot form an envelope and are left out.
    Records whose death precedes birth are also left out, but their QIDs are
    returned separately so callers can distinguish invalid data from ordinary
    missingness in the public audit.
    """
    envelopes: dict[str, NodeEnvelope] = {}
    invalid_qids: set[str] = set()

    for record in records:
        qid_value = record.get("qid")
        if qid_value is None:
            continue
        qid = str(qid_value)
        birth = _int_or_none(record.get("birthYear", record.get("birth_year")))
        death = _int_or_none(record.get("deathYear", record.get("death_year")))
        if birth is None:
            continue
        try:
            envelopes[qid] = NodeEnvelope(existed_from=birth, existed_to=death)
        except ValueError:
            invalid_qids.add(qid)

    return envelopes, invalid_qids


def _unavailable_edge(edge: Mapping[str, Any], reason: str) -> dict[str, Any]:
    return {
        **edge,
        "minStart": None,
        "maxStart": None,
        "minEnd": None,
        "maxEnd": None,
        "dateSource": None,
        "confidence": None,
        "temporalStatus": "unavailable",
        "temporalReason": reason,
    }


def temporalize_lineage_edges(
    edges: Iterable[Mapping[str, Any]],
    envelopes: Mapping[str, NodeEnvelope],
    *,
    invalid_qids: set[str] | None = None,
    now_year: int | None = None,
) -> list[dict[str, Any]]:
    """Add the shared six-field temporal contract to P1066/P737 edges.

    Wikidata direct-property lineage rows do not currently include P580/P582
    statement qualifiers, so P737 uses the two lifespans' intersection.
    P1066 additionally applies the documented 16–30 training-age prior to the
    student (``toQid``), never the teacher (``fromQid``).

    Known edges are never dropped. Missing, invalid, or disjoint lifespans get
    null temporal fields plus an explicit ``temporalReason``.
    """
    invalid = invalid_qids or set()
    output: list[dict[str, Any]] = []

    for original in edges:
        edge = dict(original)
        from_qid = str(edge.get("fromQid", ""))
        to_qid = str(edge.get("toQid", ""))

        if from_qid in invalid or to_qid in invalid:
            output.append(_unavailable_edge(edge, "invalid_endpoint_lifespan"))
            continue

        from_env = envelopes.get(from_qid)
        to_env = envelopes.get(to_qid)
        if from_env is None and to_env is None:
            output.append(_unavailable_edge(edge, "missing_both_birth_years"))
            continue
        if from_env is None:
            output.append(_unavailable_edge(edge, "missing_from_birth_year"))
            continue
        if to_env is None:
            output.append(_unavailable_edge(edge, "missing_to_birth_year"))
            continue

        kwargs: dict[str, Any] = {}
        if edge.get("relationType") == "student_of":
            kwargs["a_age_min"], kwargs["a_age_max"] = STUDENT_OF_AGE_PRIOR
        if now_year is not None:
            kwargs["now_year"] = now_year

        # The student is node_a for P1066 so the age prior applies to the
        # correct party. Envelope intersection itself is symmetric.
        env = compute_envelope(to_env, from_env, **kwargs)
        if env is None:
            output.append(_unavailable_edge(edge, "empty_lifespan_intersection"))
            continue

        output.append({
            **edge,
            "minStart": int(env.min_start),
            "maxStart": int(env.max_start),
            "minEnd": int(env.min_end),
            "maxEnd": int(env.max_end),
            "dateSource": env.date_source,
            "confidence": env.confidence,
            "temporalStatus": "dated",
            "temporalReason": None,
        })

    return output


def summarize_temporal_edges(edges: Iterable[Mapping[str, Any]]) -> dict[str, Any]:
    """Summarize dated coverage without hiding zero-count categories."""
    records = list(edges)
    dated = [edge for edge in records if edge.get("temporalStatus") == "dated"]
    confidence = Counter(str(edge["confidence"]) for edge in dated)
    date_sources = Counter(str(edge["dateSource"]) for edge in dated)
    reasons = Counter(
        str(edge.get("temporalReason") or "unspecified")
        for edge in records
        if edge.get("temporalStatus") != "dated"
    )
    total = len(records)
    return {
        "totalEdges": total,
        "datedEdges": len(dated),
        "unavailableEdges": total - len(dated),
        "datedPct": round(100 * len(dated) / total, 1) if total else 0.0,
        "confidenceCounts": {
            level: int(confidence.get(level, 0))
            for level in ("high", "medium", "low")
        },
        "dateSourceCounts": {
            source: int(date_sources.get(source, 0))
            for source in (
                "qualifier",
                "lifespan_intersect",
                "lifespan_intersect+age_prior",
            )
        },
        "unavailableReasons": dict(sorted(reasons.items())),
    }


def summarize_institutions(
    bundle: Mapping[str, Any],
    included_sculptors: int,
) -> dict[str, Any]:
    """Build compact institution coverage and concentration metadata."""
    base_meta = dict(bundle.get("meta") or {})
    institutions = dict(bundle.get("institutions") or {})
    all_edges: list[Mapping[str, Any]] = []
    for institution in institutions.values():
        all_edges.extend(institution.get("edges") or [])

    sculptors_with_institutions = {
        str(edge["sculptorQid"])
        for edge in all_edges
        if edge.get("sculptorQid")
    }
    education_edges = [
        edge for edge in all_edges if edge.get("relationType") == "educated_at"
    ]
    sculptors_with_education = {
        str(edge["sculptorQid"])
        for edge in education_edges
        if edge.get("sculptorQid")
    }
    confidence = Counter(
        str(edge.get("confidence")) for edge in all_edges if edge.get("confidence")
    )
    date_sources = Counter(
        str(edge.get("dateSource")) for edge in all_edges if edge.get("dateSource")
    )

    ranked_education = sorted(
        (
            {
                "qid": str(qid),
                "label": str(institution.get("label") or qid),
                "educationEdges": int(institution.get("educatedAtCount") or 0),
                "sculptorCount": int(institution.get("sculptorCount") or 0),
            }
            for qid, institution in institutions.items()
            if int(institution.get("educatedAtCount") or 0) > 0
        ),
        key=lambda row: (-row["educationEdges"], row["label"]),
    )
    top_five = ranked_education[:5]
    education_total = len(education_edges)

    return {
        "includedSculptors": int(included_sculptors),
        "totalInstitutions": int(base_meta.get("totalInstitutions") or len(institutions)),
        "renderedInstitutions": int(base_meta.get("renderedInstitutions") or 0),
        "totalEdges": int(base_meta.get("totalEdges") or len(all_edges)),
        "exportedEdges": int(base_meta.get("exportedEdges") or len(all_edges)),
        "skippedEmptyIntersection": int(base_meta.get("skippedEmptyIntersection") or 0),
        "sculptorsWithInstitutions": len(sculptors_with_institutions),
        "sculptorCoveragePct": (
            round(100 * len(sculptors_with_institutions) / included_sculptors, 1)
            if included_sculptors
            else 0.0
        ),
        "educationEdges": education_total,
        "workLocationEdges": len(all_edges) - education_total,
        "sculptorsWithEducation": len(sculptors_with_education),
        "educationCoveragePct": (
            round(100 * len(sculptors_with_education) / included_sculptors, 1)
            if included_sculptors
            else 0.0
        ),
        "confidenceCounts": {
            level: int(confidence.get(level, 0))
            for level in ("high", "medium", "low")
        },
        "dateSourceCounts": {
            source: int(date_sources.get(source, 0))
            for source in (
                "qualifier",
                "lifespan_intersect",
                "lifespan_intersect+age_prior",
            )
        },
        "topEducationInstitutions": top_five,
        "topFiveEducationSharePct": (
            round(
                100 * sum(row["educationEdges"] for row in top_five) / education_total,
                1,
            )
            if education_total
            else 0.0
        ),
    }
