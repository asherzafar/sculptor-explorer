"""Phase 5b.2 — temporal envelope helper for graph edges.

Implements the cross-cutting "edge dating as a window with confidence"
model defined in `docs/PHASE_5_PLAN.md`:

    Every node has a temporal envelope (existed_from, existed_to).
    Every edge between two nodes has a 4-field window:

        min_start  earliest the edge could have begun
        max_start  latest it could have begun
        min_end    earliest it could have ended
        max_end    latest it could have ended

    Plus date_source ("qualifier" | "lifespan_intersect" |
    "lifespan_intersect+age_prior") and confidence ("high" | "medium" |
    "low") so the UI can render edges as definitely-active (solid) or
    possibly-active (translucent) at any scrubbed year.

Used by the densification ingest in 5b.3 (institutional edges) and
the existing person-mentor edges' backfill in 5b.5 so /lineage has a
single dating substrate.

Design choices:
    - Wikidata P580/P582 qualifiers, when present, take precedence
      over inferred envelopes. We sanity-check them against the
      lifespan envelope (with a small slack) and drop conflicts.
    - Optional `a_age_min` / `a_age_max` lets the caller narrow the
      window using a domain prior (e.g. "training typically 16-30").
      Off by default; the consumer disclosed-toggles it.
    - `existed_to=None` means "still extant"; we substitute `now_year`.
    - Empty intersections (one node already dead before the other was
      born) return `None` and are surfaced for audit.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal, Optional

DateSource = Literal[
    "qualifier",
    "lifespan_intersect",
    "lifespan_intersect+age_prior",
]
Confidence = Literal["high", "medium", "low"]

# Slack (in years) when sanity-checking a Wikidata qualifier against
# the lifespan envelope. Wikidata occasionally records training years
# slightly outside a sculptor's documented birth/death range due to
# rounding or data-source disagreement. ±2 absorbs that without
# letting a 1900-born sculptor "train at ENSBA in 1850" through.
_QUALIFIER_SLACK_YEARS = 2

# Default "now" for envelope computations when an entity is extant.
# Not pinned to wall-clock per call so that snapshot tests are stable;
# callers that care about live-now should pass `now_year=` explicitly.
_DEFAULT_NOW_YEAR = datetime.now(timezone.utc).year


@dataclass(frozen=True)
class NodeEnvelope:
    """Temporal lifetime of a node.

    For people: (birth_year, death_year-or-None).
    For institutions: (P571 inception, P576 dissolved-or-None).
    For cities: (founding year, None) — but in practice cities pre-date
    every sculptor so the city side rarely binds the edge envelope.
    """

    existed_from: int
    existed_to: Optional[int] = None

    def __post_init__(self) -> None:
        if (
            self.existed_to is not None
            and self.existed_to < self.existed_from
        ):
            raise ValueError(
                f"NodeEnvelope: existed_to ({self.existed_to}) "
                f"precedes existed_from ({self.existed_from})"
            )


@dataclass(frozen=True)
class EdgeEnvelope:
    """When an edge between two nodes could have been active.

    Render rule (used by the lineage scrubber):
        definitely_active(Y) := max_start <= Y <= min_end
        possibly_active(Y)   := min_start <= Y <= max_end
        hidden(Y)            := otherwise

    For qualifier-backed edges, min_start == max_start and
    min_end == max_end so the entire window is "definitely active".
    For lifespan-only edges, the span between max_start and min_end
    is empty and the edge renders translucent throughout possibly_active.
    """

    min_start: int
    max_start: int
    min_end: int
    max_end: int
    date_source: DateSource
    confidence: Confidence

    def is_definitely_active(self, year: int) -> bool:
        return self.max_start <= year <= self.min_end

    def is_possibly_active(self, year: int) -> bool:
        return self.min_start <= year <= self.max_end


def _resolve_existed_to(node: NodeEnvelope, now_year: int) -> int:
    return now_year if node.existed_to is None else node.existed_to


def _qualifier_within_lifespan(
    q_start: Optional[int],
    q_end: Optional[int],
    lo: int,
    hi: int,
    slack: int,
) -> bool:
    """Sanity-check a Wikidata qualifier against the lifespan envelope.

    Returns False (drop the qualifier, fall back to lifespan) if the
    qualifier dates are inconsistent with the nodes' lifespans beyond
    the slack tolerance.
    """
    if q_start is not None and (q_start < lo - slack or q_start > hi + slack):
        return False
    if q_end is not None and (q_end < lo - slack or q_end > hi + slack):
        return False
    if q_start is not None and q_end is not None and q_start > q_end:
        return False
    return True


def compute_envelope(
    node_a: NodeEnvelope,
    node_b: NodeEnvelope,
    *,
    qualifier_start: Optional[int] = None,
    qualifier_end: Optional[int] = None,
    a_age_min: Optional[int] = None,
    a_age_max: Optional[int] = None,
    now_year: int = _DEFAULT_NOW_YEAR,
) -> Optional[EdgeEnvelope]:
    """Compute the temporal envelope for an edge between two nodes.

    The age-prior parameters narrow `node_a`'s lifespan window to
    `[a.existed_from + a_age_min, a.existed_from + a_age_max]` before
    intersecting with `node_b`. By convention `node_a` is the party the
    prior pertains to (e.g. the sculptor on a P69 educated_at edge —
    "training typically 16-30 years old" applies to the student, not
    the institution).

    Returns `None` when the lifespan intersection is empty (data quality
    bug — one entity already dead before the other was born). Callers
    should log/audit these rather than silently dropping them.
    """
    # Resolve open-ended lifespans against `now_year`.
    a_to = _resolve_existed_to(node_a, now_year)
    b_to = _resolve_existed_to(node_b, now_year)
    a_from = node_a.existed_from
    b_from = node_b.existed_from

    # Compute the unprior'd lifespan intersection first so we always
    # have a fallback if the age prior would empty the window.
    lo_lifespan = max(a_from, b_from)
    hi_lifespan = min(a_to, b_to)
    if lo_lifespan > hi_lifespan:
        # Real data bug: lifespans don't overlap. Surface as None so
        # the caller can audit. The age prior can't help here because
        # the underlying entities never co-existed.
        return None

    # Apply age prior to node_a if both bounds provided AND the result
    # produces a non-empty intersection with node_b. If the prior would
    # narrow node_a's window such that intersection becomes empty
    # (e.g. a sculptor who trained at 45 at a school that opened when
    # they were 50, intersected with an "education happens 16-30"
    # prior), we drop the prior for THIS edge and fall back to the
    # unpriored lifespan window. The edge really exists; we just lose
    # the prior's narrowing power.
    has_age_prior = a_age_min is not None and a_age_max is not None
    lo, hi = lo_lifespan, hi_lifespan
    if has_age_prior:
        assert a_age_min is not None and a_age_max is not None
        a_from_pri = max(a_from, node_a.existed_from + a_age_min)
        a_to_pri = min(a_to, node_a.existed_from + a_age_max)
        lo_pri = max(a_from_pri, b_from)
        hi_pri = min(a_to_pri, b_to)
        if a_to_pri < a_from_pri or lo_pri > hi_pri:
            # Prior collapses either node_a alone (prior extends past
            # actual lifespan) or the joint intersection (real edge
            # outside the typical age window). Either way: drop prior.
            has_age_prior = False
        else:
            lo, hi = lo_pri, hi_pri

    # Qualifier path: prefer explicit Wikidata dates if present and
    # consistent with the lifespan envelope.
    has_qualifier = qualifier_start is not None or qualifier_end is not None
    if has_qualifier and _qualifier_within_lifespan(
        qualifier_start, qualifier_end, lo, hi, _QUALIFIER_SLACK_YEARS
    ):
        # Open-ended qualifier (only one of start/end present): clamp
        # the missing side to the lifespan-envelope edge.
        q_start_raw = qualifier_start if qualifier_start is not None else lo
        q_end_raw = qualifier_end if qualifier_end is not None else hi
        # Clamp each endpoint independently into [lo, hi]. The slack
        # check above admits qualifiers that fall just outside the
        # lifespan window (Wikidata off-by-one); clamping pulls them
        # back to the boundary so we never claim activity outside the
        # nodes' actual lifetimes.
        q_start = min(max(q_start_raw, lo), hi)
        q_end = min(max(q_end_raw, lo), hi)
        # After symmetric clamping into [lo, hi], q_start <= q_end is
        # only violated if Wikidata recorded a reversed interval, which
        # _qualifier_within_lifespan already filters. Defensive check:
        if q_start <= q_end:
            return EdgeEnvelope(
                min_start=q_start,
                max_start=q_start,
                min_end=q_end,
                max_end=q_end,
                date_source="qualifier",
                confidence="high",
            )

    # Lifespan-intersect path (with optional age prior baked into a_from/a_to).
    return EdgeEnvelope(
        min_start=lo,
        max_start=hi,
        min_end=lo,
        max_end=hi,
        date_source=(
            "lifespan_intersect+age_prior" if has_age_prior else "lifespan_intersect"
        ),
        confidence="low" if has_age_prior else "medium",
    )


# =============================================================================
# Common edge-type priors. These are documented and consumed at ingest
# time (5b.3 calls compute_envelope with these values for educated_at
# edges, etc.). The age windows are starting points; actual values live
# in the ingest module so they're co-located with their consumers.
# =============================================================================
EDUCATED_AT_AGE_PRIOR = (16, 30)  # student-side; ENSBA / Académie / Bauhaus etc.
WORK_LOCATION_AGE_PRIOR = (18, 80)  # adulthood; broad
STUDENT_OF_AGE_PRIOR = (16, 30)  # younger party in a mentor-student edge
