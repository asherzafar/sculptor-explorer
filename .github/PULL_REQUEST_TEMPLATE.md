## Outcome

<!-- What user-visible, engineering, or documentation outcome does this PR deliver? -->

## Scope and rationale

<!-- List the coherent files/systems changed and why. Call out deliberate non-goals. -->

## Stack and review base

- Base branch:
- Head branch:
- Full head SHA:
- Parent PR (or `none`):
- Child PRs (or `none`):
- Full diff reviewed against:

## Validation

- Local checks:
- GitHub Actions run/check:
- Known warnings or failures:

## Deployment evidence

- Vercel deployment ID:
- Immutable preview URL:
- Source branch and full SHA:
- State and route smoke result:
- Production change: `none` unless separately approved

## External effects and rollback

<!-- Provider/repository setting changes, redirects, integrations, credentials, data migrations, or `none`. Never include secret values. -->

- External effects:
- Rollback/retention boundary:

## Merge authorization

<!-- A draft PR does not imply any of these approvals. Fill these only after an explicit owner decision. -->

- Merge approval: `pending` / `approved`
- Approved full head SHA:
- Approved strategy: `merge commit`
- Exact branch deletion approval: `none` / branch name

## Post-merge closeout

<!-- Complete after merge; do not call the task landed while required evidence is pending. -->

- Merge commit:
- Default-branch Actions run/result:
- Vercel production deployment ID/state/source SHA:
- Canonical production route smoke:
- Dependency audits or other post-merge gates:
- PR/branch/worktree/provider/handoff reconciliation:

## Review checklist

- [ ] The PR base and any stack relationships are explicit and current.
- [ ] The complete diff contains no unrelated local work.
- [ ] Required checks refer to the exact remote head and are complete.
- [ ] The Vercel deployment refers to the exact remote head and is `READY`.
- [ ] No merge, production promotion, provider mutation, or cleanup is implied by this draft PR.
- [ ] Documentation and handoff state agree with the implementation.
- [ ] If merging, the approved head SHA was re-read immediately before the head-protected merge.
- [ ] If merged, default-branch CI and exact-SHA production verification passed before closeout.
