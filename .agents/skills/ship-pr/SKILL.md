---
name: ship-pr
description: Publish, push, ship, or create or update a pull request for a scoped change in this repository. Use only when the user explicitly asks for a GitHub publishing action.
---

# Ship a repository change

This is an instruction-only repository workflow. `AGENTS.md` remains the
canonical policy and `docs/SOURCE_CONTROL_AND_DELIVERY.md` defines the delivery
contract; if these sources differ from this skill, stop and reconcile the
contradiction before publishing.

## Authorization and completion boundary

- A request to implement, review, or validate is not permission to commit,
  push, open or update a pull request, or merge. Publish only after the user
  explicitly asks for the relevant action.
- Never merge unless the user explicitly requests the exact merge.
- Do not call the task complete while any required check is pending, skipped,
  failed, or externally blocked. Use the status vocabulary in `AGENTS.md`.

## Workflow

1. Read and obey `AGENTS.md`, including its publishing rules, and inspect any
   nested instructions that apply to the changed files.
2. Confirm that the current branch is a named `codex/...` branch. Stop on a
   detached head, default branch, or unexpected branch until the branch
   strategy is explicit.
3. Confirm the intended pull-request base branch. Do not infer `main` when the
   work is part of a stacked release-candidate sequence. Record parent and child
   PRs, and confirm that no unreviewed branch is hidden below the first PR.
4. Inspect `git status --short --branch`, the complete scoped diff, the diff
   against the intended base, and recent commits. Preserve unrelated work.
5. Run checks proportional to the change. Run `./scripts/validate.sh` for
   application, pipeline, schema, generated-data, build, or CI-runtime changes;
   run the explicit Playwright gate when rendered behavior or its test/runtime
   path changed. Documentation-only work follows the minimum gate in
   `AGENTS.md`.
6. Review the change locally against the intended base. Use a supported
   repository review command when available; otherwise inspect the complete
   `base...HEAD` and working-tree diff and report findings before publishing.
   Resolve material findings or record why they remain.
7. Stage explicit intended paths. Do not use `git add -A`. Inspect the staged
   file list and staged diff, then run `git diff --cached --check`.
8. Create one focused commit whose message describes the whole scoped change.
9. Push the named branch with upstream tracking.
10. Create or update a **draft** pull request with the explicit base branch.
    The body must state the outcome, rationale, complete scope, validation,
    known risks, and follow-up work.
11. Inspect GitHub Actions and all other required checks on the exact remote
    head. Retrieve the run/job annotations and useful logs for failures; do not
    diagnose a missing log blob as an application failure when no job started.
12. Inspect the corresponding Vercel Preview Deployment for the exact commit.
    Record its deployment ID, immutable deployment/preview URL, ready state,
    source branch and SHA, and useful build logs if it failed. Run
    `scripts/verify-deployment.sh` against a public exact deployment URL. Do not
    treat a floating branch alias as immutable evidence and do not promote the
    preview to production.
13. Separate required repository/preview checks from unrelated external
    integrations. Keep an unrelated failure visible and owned, but do not
    silently change, disable, or delete the integration to make the PR green.
14. Reconcile local head, remote head, PR head/base/stack/draft state, task
    worktree cleanliness, GitHub checks, Vercel state, and every external side
    effect before handing off.

## Final report

Report:

- task status and whether the task is safe to archive;
- branch, full commit SHA, PR base/head/draft state, and PR URL;
- parent/child PRs for stacked work, or an explicit statement that the PR is
  unstacked;
- Vercel deployment ID, immutable preview/deployment URL, source SHA, and route
  smoke result;
- every required check and its result;
- validation run locally;
- unresolved risks or external blockers; and
- the exact seed prompt for the next bounded task, or state that no next task
  is required.
