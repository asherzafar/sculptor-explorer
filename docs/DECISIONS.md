# Decision Log

This is the compact record of consequential product, research, and architecture decisions. Rationale lives in the linked document; implementation detail belongs in architecture/design docs. Update a row when evidence changes the decision—do not silently contradict it elsewhere.

## Active decisions

| ID | Decision | Status | Revisit when | Rationale/source |
|---|---|---|---|---|
| D001 | Keep **Sculpture in Data** as the public identity through Phase 5Q. | Accepted | A second artistic discipline passes a data/model/user-value pilot. | Founder confirmation, 2026-08-02; `docs/EXPLORATION_STRATEGY.md` |
| D002 | Treat sculpture as the first deep domain, not the permanent ontology boundary. | Accepted | The artist-neutral model proves unable to preserve sculpture-specific meaning. | `docs/PROJECT_CHARTER.md` |
| D003 | Make the quality-gated public explorer the primary product, supported by an isolated exploration lab. | Accepted | The split causes duplicated infrastructure or prevents useful learning. | Founder confirmation, 2026-08-02; `docs/EXPLORATION_STRATEGY.md` |
| D004 | Finish 5b.5, then pass Phase 5Q before new large public visualizations. | Accepted | A production-critical issue forces reordering; lab prototypes do not count as production starts. | `docs/ROADMAP.md` |
| D005 | Keep documented influence, affiliation, co-presence, similarity, and prediction as separate relationship layers. | Accepted | Never merge merely for visual simplicity; any semantic change requires explicit evidence review. | `docs/EXPLORATION_STRATEGY.md` |
| D006 | Model entities, events, time, assertions, and provenance before choosing a graph database. | Accepted | At least three important workflows demonstrate the same storage/query limitation. | `docs/ARCHITECTURE.md` |
| D007 | Keep a default work-in-progress limit of one active lab experiment. | Accepted | The workflow proves too restrictive or multiple experiments have genuinely independent capacity. | Founder confirmation, 2026-08-02; `docs/PROJECT_CHARTER.md` |
| D008 | Prefer a static or small-multiple temporal baseline before animated network views. | Working | User testing shows animation materially improves a change-over-time task and has an accessible equivalent. | `docs/RESEARCH_FOUNDATIONS.md` |
| D009 | Treat 1800 as the current public data boundary, not a permanent model limit. | Accepted | An earlier-period source-fitness pilot supports a responsible boundary change. | `docs/EXPLORATION_STRATEGY.md` |
| D010 | The public explorer may show rule- or model-derived relationships only as opt-in layers that are visibly and semantically distinct from source assertions and expose their method/evidence. | Accepted | User research shows the distinction is still misunderstood, or the evidence contract cannot be met. | Founder confirmation, 2026-08-02; `docs/EXPLORATION_STRATEGY.md` |
| D011 | Attribute gender, citizenship, movement, and cultural labels to their source; do not infer identity or expand disjoint P27 sets/endpoints into travel, migration motive, refugee status, or cross-cultural influence. | Accepted | A stronger source/model is added or relevant domain/community review supports a specific consequential claim. | `docs/DATASET_DATASHEET.md`; `docs/CLAIM_REGISTER.md` |
| D012 | Treat `sculptor-explorer.vercel.app` as canonical production. Retire the stale Netlify deployment through a path-preserving redirect and review window before deciding whether to delete it. | Accepted | A custom domain becomes canonical or a different host passes deployment-scale review. | Founder direction, 2026-08-02; `docs/ROADMAP.md` |
| D013 | Use fixed 50-record semantic pagination for Explore, with deterministic URL-backed query, sort, movement-record filter, and page state, instead of accessible virtualization. | Working | Exact-head rendered QA or task testing shows page navigation cannot meet find/browse/share needs, or the 50-record DOM/interaction budget regresses. | Phase 5Q.4b scale, keyboard, mobile, and performance tests; `docs/DESIGN_SYSTEM.md` |

## Decisions requiring founder input

These are intentionally deferred until they affect a concrete workstream.

| Question | Recommended default | Needed before |
|---|---|---|
| Who is the first validation audience? | Original NSS/sculpture relationship plus several curious cultural-data readers; include one educator/researcher. | Recruiting the five Phase 5Q sessions. |
| How aggressively should breadth trade against depth? | Pilot one second discipline deeply before multi-discipline ingestion. | Starting artist-neutral data acquisition. |
| What should the second discipline be? | Decide from the most interesting cross-domain question and measured source fitness, not familiarity alone. | Second-domain probe. |

## Decision update format

When changing a decision, add a dated note below rather than erasing the prior reasoning:

```markdown
### YYYY-MM-DD — D00X changed from … to …

Evidence:
Consequences:
Documents/code updated:
Next review trigger:
```

### 2026-08-02 — D001, D003, D007, and D010 confirmed

Evidence: the founder accepted the recommended defaults for the public
identity, public-explorer/lab balance, one-experiment work-in-progress
limit, and explicitly labeled derived relationship layers.

Consequences: Phase 5b.5 proceeds without a naming or product-model
detour; Phase 5Q remains the public-production gate; experiments stay
bounded; derived layers require opt-in presentation and traceable methods.

Documents/code updated: `docs/DECISIONS.md`,
`docs/EXPLORATION_STRATEGY.md`, and `docs/AGENT_HANDOFF.md`.

Next review trigger: the individual decision rows above.

### 2026-08-05 — D013 selected for the Explore route candidate

Evidence: the 5Q.4a baseline measured 3,543 mounted rows and 4,423 focusable
elements. The 5Q.4b candidate bounds each result page to 50 native table/list
records, preserves deterministic entity links, serializes all consequential
state, and passes focused first/middle/last/empty/filtered, keyboard, mobile,
target, contrast, and sub-200ms search checks locally.

Consequences: Explore does not adopt an accessibility-sensitive virtualization
layer or retain the now-unused table runtime. This choice does not prescribe
pagination for Timeline, Evolution, Migration, or Lineage.

Documents/code updated: `web/src/app/explore/`, focused unit/browser tests,
`docs/ROADMAP.md`, `docs/PHASE_5_PLAN.md`, `docs/DESIGN_SYSTEM.md`,
`docs/ARCHITECTURE.md`, `docs/CLAIM_REGISTER.md`, and this log.

Next review trigger: exact-head landing-hotfix Preview visual QA and real reader
task evidence.

### 2026-08-06 — D013 retained after the PR #24 landing review

Evidence: PR #24 merged the fixed 50-record semantic pagination architecture as
`8633902fa01d02f72e325c53944780b40b219ec8`; its default-branch validation,
exact-SHA Vercel production deployment, and route probes passed. A Codex review
submitted after the merge identified three reproducible boundary defects in
the route state and responsive summary, not a failure of the pagination
decision: sequential multi-word typing lost spaces, the pipeline movement
sentinel sorted as visible text, and a null death year became “present” on
mobile.

Consequences: retain D013 and the canonical URL as the source of result state.
Use only an ephemeral input draft for insignificant whitespace during active
editing; canonicalize it on blur and in shared URLs. Normalize the movement
sentinel into the existing missing-value comparator, and render an unknown
death year explicitly unless the source contract carries living status.

Documents/code updated: `web/src/app/explore/`, focused unit/browser tests,
`docs/ROADMAP.md`, `docs/PHASE_5_PLAN.md`, `docs/DESIGN_SYSTEM.md`,
`docs/CLAIM_REGISTER.md`, `docs/AGENT_HANDOFF.md`, and this log.

Next review trigger: exact-head hotfix CI and Preview QA, then real reader task
evidence before this pagination pattern is propagated.

### 2026-08-07 — D013 retained after the PR #25 production landing

Evidence: PR #25 passed required `validate` and Vercel checks at reviewed head
`d7dd1955f1cc4360430c7957d9e0508ed5d8c2a7`, including a `READY` exact-SHA
Preview and desktop/390px rendered replay. It then merged as
`c22cba075ef36373f635d114ffa2d6f3d9ca17f9`. Default-branch Actions run
`31193771731` passed the full validation and 21 browser journeys; Git-backed
Vercel production deployment `dpl_6tfRw7nJJ1QeR9Mxvnf22GWZSB61` reached
`READY` from that exact merge, and canonical routes returned 200 while the
missing-route probe returned 404. Review conversations were resolved, and the
retained task branches/worktrees were clean.

Consequences: close Explore as the first Phase 5Q.4b route slice. Keep D013
working rather than accepted until real-reader find/browse/share evidence is
available; do not propagate fixed pagination mechanically to Timeline or the
dense analytical routes. Timeline is the next independent route-slice review.

Documents/code updated: production behavior and regressions landed in PR #25;
`docs/ROADMAP.md`, `docs/PHASE_5_PLAN.md`, `docs/DESIGN_SYSTEM.md`,
`docs/CLAIM_REGISTER.md`, `docs/AGENT_HANDOFF.md`, and this log record the
verified closeout.

Next review trigger: real reader task evidence or a measured regression in
find/share success, native page semantics, bounded focus order, or the
50-record interaction/performance budget.
