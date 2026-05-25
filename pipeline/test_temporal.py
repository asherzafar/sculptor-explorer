"""Phase 5b.2 tests — temporal envelope helper.

Pure-function tests against `temporal.compute_envelope`, covering the
five behaviours that matter:

    1. Lifespan intersection is the default substrate.
    2. Wikidata qualifier dates take precedence when consistent.
    3. Inconsistent qualifiers (outside lifespan ± slack) are dropped
       and we fall back to lifespan.
    4. Age priors narrow the envelope and shift confidence to "low".
    5. Empty intersections (data quality bugs) return None.

Run: python -m test_temporal
"""
from __future__ import annotations

from temporal import (
    EDUCATED_AT_AGE_PRIOR,
    NodeEnvelope,
    compute_envelope,
)


# ---------------------------------------------------------------------------
# Test fixtures: real-ish entities. The years here aren't load-bearing —
# they just need to be plausible.
# ---------------------------------------------------------------------------
SCULPTOR_RODIN = NodeEnvelope(existed_from=1840, existed_to=1917)  # Rodin
SCULPTOR_BOURGEOIS = NodeEnvelope(existed_from=1911, existed_to=2010)  # Bourgeois
SCULPTOR_LIVING = NodeEnvelope(existed_from=1960, existed_to=None)  # still alive
ENSBA = NodeEnvelope(existed_from=1648, existed_to=None)  # Beaux-Arts Paris
BAUHAUS = NodeEnvelope(existed_from=1919, existed_to=1933)  # closed by Nazis
ASL = NodeEnvelope(existed_from=1875, existed_to=None)  # Art Students League NY


def _assert(cond: bool, msg: str = "assertion failed") -> None:
    if not cond:
        raise AssertionError(msg)


# ---------------------------------------------------------------------------
# 1. Lifespan intersection is the default substrate.
# ---------------------------------------------------------------------------
def test_lifespan_intersect_two_living_extant() -> None:
    """Living sculptor + extant institution → intersection is sculptor's lifespan,
    bounded above by current year (which is >= the sculptor's birth)."""
    env = compute_envelope(SCULPTOR_LIVING, ENSBA, now_year=2026)
    _assert(env is not None, "expected envelope, got None")
    assert env is not None
    _assert(env.min_start == 1960, f"min_start={env.min_start}, expected 1960")
    _assert(env.max_end == 2026, f"max_end={env.max_end}, expected 2026")
    _assert(
        env.date_source == "lifespan_intersect",
        f"source={env.date_source}",
    )
    _assert(env.confidence == "medium", f"confidence={env.confidence}")


def test_lifespan_intersect_dead_sculptor_extant_institution() -> None:
    """Dead sculptor + extant institution → bounded by sculptor's death."""
    env = compute_envelope(SCULPTOR_RODIN, ENSBA, now_year=2026)
    assert env is not None
    _assert(env.min_start == 1840, f"min_start={env.min_start}")
    _assert(env.max_end == 1917, f"max_end={env.max_end}")


def test_lifespan_intersect_with_dissolved_institution() -> None:
    """Sculptor lifespan + Bauhaus's 1919-1933 window."""
    env = compute_envelope(SCULPTOR_BOURGEOIS, BAUHAUS, now_year=2026)
    assert env is not None
    # Bourgeois 1911-2010 ∩ Bauhaus 1919-1933 = 1919-1933
    _assert(env.min_start == 1919, f"min_start={env.min_start}")
    _assert(env.max_end == 1933, f"max_end={env.max_end}")


def test_definitely_active_empty_under_lifespan_only() -> None:
    """Without qualifiers or priors, no year is "definitely active" —
    only "possibly active" throughout the intersection."""
    env = compute_envelope(SCULPTOR_RODIN, ENSBA, now_year=2026)
    assert env is not None
    # max_start (1917) > min_end (1840) means the [max_start, min_end]
    # interval is empty — no Y satisfies the strict definitely-active rule.
    for y in (1840, 1880, 1900, 1917):
        _assert(
            not env.is_definitely_active(y),
            f"year {y} should NOT be definitely active under lifespan-only",
        )
        _assert(
            env.is_possibly_active(y),
            f"year {y} should be possibly active",
        )


# ---------------------------------------------------------------------------
# 2. Qualifier dates take precedence.
# ---------------------------------------------------------------------------
def test_qualifier_high_confidence() -> None:
    """Rodin 'studied at ENSBA 1854-1857' (hypothetical exact dates)."""
    env = compute_envelope(
        SCULPTOR_RODIN, ENSBA, qualifier_start=1854, qualifier_end=1857
    )
    assert env is not None
    _assert(env.date_source == "qualifier", f"source={env.date_source}")
    _assert(env.confidence == "high", f"confidence={env.confidence}")
    _assert(env.min_start == 1854 and env.max_start == 1854, "start collapsed")
    _assert(env.min_end == 1857 and env.max_end == 1857, "end collapsed")
    # Definitely-active across the qualifier window.
    for y in (1854, 1855, 1856, 1857):
        _assert(env.is_definitely_active(y), f"year {y} should be definitely active")
    _assert(not env.is_definitely_active(1853), "1853 outside qualifier")


def test_qualifier_open_ended_clamps_to_lifespan() -> None:
    """Only start qualifier present → end clamps to lifespan envelope."""
    env = compute_envelope(
        SCULPTOR_RODIN, ENSBA, qualifier_start=1854, qualifier_end=None
    )
    assert env is not None
    _assert(env.date_source == "qualifier")
    _assert(env.min_start == 1854 and env.max_start == 1854)
    # End falls back to Rodin's death year via lifespan.
    _assert(env.max_end == 1917, f"max_end={env.max_end}")


# ---------------------------------------------------------------------------
# 3. Inconsistent qualifiers are dropped.
# ---------------------------------------------------------------------------
def test_qualifier_outside_lifespan_drops_to_lifespan() -> None:
    """Bourgeois (b. 1911) 'studied at ENSBA in 1850' — clearly impossible.
    Should fall back to lifespan_intersect, not silently use the bad date."""
    env = compute_envelope(
        SCULPTOR_BOURGEOIS, ENSBA, qualifier_start=1850, qualifier_end=1855
    )
    assert env is not None
    _assert(
        env.date_source == "lifespan_intersect",
        f"expected lifespan fallback, got {env.date_source}",
    )
    _assert(env.confidence == "medium")


def test_qualifier_within_slack_accepted() -> None:
    """Qualifier within ±2 years of lifespan edge is accepted (Wikidata
    occasionally records the boundary year imprecisely)."""
    # Bauhaus 1919-1933; sculptor "studied 1934" (1 year past dissolution)
    # is within slack and should still be accepted.
    sculptor = NodeEnvelope(existed_from=1900, existed_to=1980)
    env = compute_envelope(
        sculptor, BAUHAUS, qualifier_start=1934, qualifier_end=1934
    )
    assert env is not None
    _assert(env.date_source == "qualifier", f"got {env.date_source}")
    # Clamped back into Bauhaus lifespan after acceptance.
    _assert(env.max_end <= 1933, f"max_end={env.max_end} should clamp")


# ---------------------------------------------------------------------------
# 4. Age priors narrow the envelope.
# ---------------------------------------------------------------------------
def test_age_prior_narrows_window() -> None:
    """Living sculptor (b. 1960) at ENSBA without qualifier:
        Without prior: 1960-2026 (66-year window)
        With educated_at prior (16-30): 1976-1990 (14-year window)
    """
    a_min, a_max = EDUCATED_AT_AGE_PRIOR
    env = compute_envelope(
        SCULPTOR_LIVING,
        ENSBA,
        a_age_min=a_min,
        a_age_max=a_max,
        now_year=2026,
    )
    assert env is not None
    _assert(env.date_source == "lifespan_intersect+age_prior")
    _assert(env.confidence == "low")
    _assert(env.min_start == 1976, f"min_start={env.min_start}")
    _assert(env.max_end == 1990, f"max_end={env.max_end}")


def test_age_prior_clamped_by_short_lifespan() -> None:
    """A sculptor who died at 25 — the educated_at prior of 16-30 gets
    clamped to their actual lifespan, not extended past death."""
    young = NodeEnvelope(existed_from=1900, existed_to=1925)
    a_min, a_max = EDUCATED_AT_AGE_PRIOR
    env = compute_envelope(
        young, ENSBA, a_age_min=a_min, a_age_max=a_max, now_year=2026
    )
    assert env is not None
    # birth+16 = 1916, birth+30 = 1930. But death = 1925 caps it.
    _assert(env.min_start == 1916, f"min_start={env.min_start}")
    _assert(env.max_end == 1925, f"max_end={env.max_end}")


# ---------------------------------------------------------------------------
# 5. Empty intersections.
# ---------------------------------------------------------------------------
def test_empty_intersection_returns_none() -> None:
    """A sculptor born after another died — no edge is possible."""
    earlier = NodeEnvelope(existed_from=1700, existed_to=1750)
    later = NodeEnvelope(existed_from=1800, existed_to=1850)
    env = compute_envelope(earlier, later)
    _assert(env is None, "expected None for non-overlapping lifespans")


def test_empty_after_age_prior_falls_back_to_lifespan() -> None:
    """If the age prior would empty node_a's window (e.g. died at 14
    with educated_at prior of 16-30), the helper falls back to raw
    lifespan rather than returning None."""
    very_young = NodeEnvelope(existed_from=1900, existed_to=1914)  # died at 14
    a_min, a_max = EDUCATED_AT_AGE_PRIOR
    env = compute_envelope(
        very_young,
        ENSBA,
        a_age_min=a_min,
        a_age_max=a_max,
        now_year=2026,
    )
    assert env is not None
    # Falls back to lifespan, not prior.
    _assert(env.date_source == "lifespan_intersect", f"got {env.date_source}")
    _assert(env.min_start == 1900 and env.max_end == 1914)


def test_prior_empties_joint_intersection_falls_back() -> None:
    """Real-data case from the 5b.1 audit: a sculptor trained at an
    institution at age >30 (e.g. Bourgeois-style late-career return
    to school). The lifespan intersection [school_open, sculptor_death]
    is non-empty, but applying a 16-30 prior to the sculptor pushes
    their candidate window before the school existed.

    The helper must drop the prior for this edge rather than return
    None — the edge genuinely exists, we just can't narrow it."""
    # Sculptor born 1900, died 1980. Trained at Bauhaus (1919-1933) at
    # age 30 — within the 16-30 prior, the candidate window is
    # [1916, 1930]. Intersection with [1919, 1933] = [1919, 1930]. OK.
    # Now shift: sculptor trained at a school that only opened when
    # they were 40. Prior window [1916, 1930] doesn't intersect [1940+].
    sculptor = NodeEnvelope(existed_from=1900, existed_to=1980)
    late_school = NodeEnvelope(existed_from=1940, existed_to=1970)
    a_min, a_max = EDUCATED_AT_AGE_PRIOR
    env = compute_envelope(
        sculptor,
        late_school,
        a_age_min=a_min,
        a_age_max=a_max,
    )
    assert env is not None, "edge should not be dropped — both entities co-existed"
    _assert(env.date_source == "lifespan_intersect", f"got {env.date_source}")
    # Falls back to unpriored lifespan intersection: [1940, 1970].
    _assert(env.min_start == 1940 and env.max_end == 1970)


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------
def main() -> None:
    tests = [v for k, v in globals().items() if k.startswith("test_")]
    failures = []
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except AssertionError as e:
            print(f"  ✗ {t.__name__}: {e}")
            failures.append(t.__name__)
        except Exception as e:
            print(f"  ✗ {t.__name__}: {type(e).__name__}: {e}")
            failures.append(t.__name__)
    print()
    if failures:
        print(f"{len(failures)} failed of {len(tests)}: {failures}")
        raise SystemExit(1)
    print(f"All {len(tests)} temporal-envelope tests passed.")


if __name__ == "__main__":
    main()
