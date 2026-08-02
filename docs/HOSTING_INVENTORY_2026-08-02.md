# Hosting inventory — 2026-08-02

**Status:** Phase 5Q.4c inventory reviewed; approved implementation executed; branch publication approved on 2026-08-02

**Branch:** `codex/phase-5q4c-hosting-retirement`

**Base:** approved workflow-standards checkpoint `e4596b7a88355b680570d7203c6781f0985730c3`

**Scope:** The inventory first pass was read-only. The approved implementation appended below made one Netlify draft deploy and one Netlify production redirect deploy. It made no Vercel, Cloudflare, authentication, integration, domain, deletion, retention-policy, rollback, roadmap, or handoff change.

## Recommended disposition

| Provider | Current role | Recommendation | Why |
|---|---|---|---|
| Vercel | Canonical production and Git-backed PR previews | **NO CHANGE — VERIFIED AFTER IMPLEMENTATION.** Keep production on `sculptor-explorer.vercel.app`; do not promote either open PR preview and do not clean up deployments in the retirement task. | Production remained `READY` on the same `main` deployment before and after Netlify migration. |
| Netlify | Legacy hostname now forwarding to canonical production | **REDIRECT AND RETAIN — IMPLEMENTED.** Keep the path- and query-preserving 301 indefinitely; observe through 2026-10-31. | A permanent redirect preserves unknown old links. Deletion would replace a working migration path with dead links. |
| Cloudflare Workers | Disabled Worker URLs and no custom domain/route, but an active manual version and stale Git build integration/check | **DISCONNECT BUILD INTEGRATION, RETAIN SERVICE — RECOMMENDED, NOT YET EXECUTED.** Disconnect only this Worker's repository build integration after explicit approval; preserve active version `cf3a4cff` and the service for at least 30 days. Do not proxy Vercel through Cloudflare and do not delete the Worker until service-scoped traffic is verified through the newly installed Cloudflare MCP. | Disconnecting the per-Worker Git integration stops irrelevant failed checks without changing the disabled URLs, routes, or retained manual deployment. The supplied 30-day CSV totals 944 account-scoped requests, so it cannot justify deletion or a zero-traffic claim. |

These dispositions implement accepted decision D012 without treating an unrelated Cloudflare failure as a repository or Vercel failure.

## Evidence labels

- **Verified** means observed directly in a connected provider response, provider CLI/API response, GitHub check metadata, repository history/configuration, public HTTP response, or browser DOM on 2026-08-02.
- **Inference** means the evidence strongly suggests the statement but the provider did not expose the authoritative field.
- **Owner-only** means the value exists behind a provider account screen that the available read-only connection did not expose. Exact inspection steps are below; no login or authentication change was attempted.
- **Owner-attested** means the account owner supplied the fact or screenshot directly; it is recorded separately from API-verified provider state.

## Shared repository and branch map

### Verified

- GitHub repository: public `asherzafar/sculptor-explorer`, repository ID `1210030746`, owned by user `asherzafar`; default branch `main`. The connected GitHub app reports administrative repository permission.
- Canonical production source: `main` at `5b2d621fc2becba1c1b0c0ff8973c344626a33e7`.
- Preview/check source 1: draft PR [#1](https://github.com/asherzafar/sculptor-explorer/pull/1), branch `codex/phase-5q4-rendered-baseline`, commit `8bb61a777007851abc060047894ed7e9c1828629`.
- Preview/check source 2: draft PR [#2](https://github.com/asherzafar/sculptor-explorer/pull/2), branch `codex/phase-5q4-workflow-standards`, commit `e4596b7a88355b680570d7203c6781f0985730c3`.
- The repository has no current `wrangler.toml` and no Cloudflare GitHub Actions workflow. It retains `web/netlify.toml`; Vercel configuration is primarily the provider project plus the `web` package and `web/next.config.ts` static-export contract.

## Vercel — canonical production and previews

### Verified facts

**Ownership and project**

- Team: `asherzafar's projects`, slug `asherzafars-projects`, ID `team_DVRWeZZ3ECcD6eM5DqMruoqL`.
- Project: `sculptor-explorer`, ID `prj_u5FmLz6CKm2hpugtVydrXcFVdb99`, created `2026-04-26T20:50:34Z`.
- Deployment creator shown by Vercel: username `asherzafar`. No credential, token, secret, or environment-variable value was inspected or recorded.
- Framework: Next.js. Project runtime setting returned by Vercel: Node `24.x`.

**Domains and production**

- Project domains returned by Vercel:
  - `sculptor-explorer.vercel.app`
  - `sculptor-explorer-asherzafars-projects.vercel.app`
  - `sculptor-explorer-git-main-asherzafars-projects.vercel.app`
- No custom domain appeared in the connected project response.
- `https://sculptor-explorer.vercel.app/` resolves to production deployment `dpl_7C9BUQyu8CEoAhZe9J2wSU7cpix5`, created `2026-06-11T15:19:38Z`, state `READY`, target `production`, source `git`, region `iad1`.
- The deployment metadata identifies `github.com/asherzafar/sculptor-explorer`, branch `main`, and commit `5b2d621fc2becba1c1b0c0ff8973c344626a33e7`. Its three aliases are the three project domains above.
- Public HEAD requests to `/` and `/timeline` returned HTTP 200 with `server: Vercel` and no redirect on 2026-08-02.
- The current application metadata base is `https://sculptor-explorer.vercel.app` in `web/src/app/layout.tsx`.

**Build settings and artifact**

- Production build logs show Vercel cloning the repository at `main@5b2d621`, running `vercel build`, installing npm dependencies, and running `npm run build` for package `web`. The production build used Next.js 16.2.3/Turbopack and generated 3,626 static pages.
- The current checkpoint's `web/package.json` defines `npm run build` as `next build --webpack`; `web/next.config.ts` sets `output: "export"` and unoptimized images.
- PR #2 preview build logs show `codex/phase-5q4-workflow-standards@e4596b7`, `npm run build`, Next.js 16.2.12/Webpack, 3,625 static routes, and a completed deployment. Vercel reports the project runtime as Node 24 even though the repository engine still says `>=20.9.0`; that drift belongs to the separate Node task.
- The connected API did not expose environment variables. None are needed to establish the static-host ownership findings, and no secret values were requested.

**Preview configuration proven in practice**

| Source | Vercel deployment | Immutable deployment URL | Branch alias | State/target |
|---|---|---|---|---|
| PR #1 / `8bb61a7` | `dpl_6TjcD9Y1LRRa9D56o83mgomABmmr` | `sculptor-explorer-hgkmgumny-asherzafars-projects.vercel.app` | `sculptor-explorer-git-codex-phase-5-e7ba44-asherzafars-projects.vercel.app` | `READY`; preview (`target: null`) |
| PR #2 / `e4596b7` | `dpl_Ckwdi4s4HEtaZrT4cV9ThAewUKrD` | `sculptor-explorer-cmxxjkshh-asherzafars-projects.vercel.app` | `sculptor-explorer-git-codex-phase-5-bda9e9-asherzafars-projects.vercel.app` | `READY`; preview (`target: null`) |

- GitHub's Vercel commit status is `success` on both exact commits and points to the matching Vercel deployment inspector.
- The Vercel GitHub App check `Vercel Preview Comments` also passed on both commits. On `e4596b7`, it reported zero unresolved and zero resolved feedback.
- Neither preview carries a production target or canonical production alias. No preview was promoted in this task.

**Retention and rollback**

- Vercel returned the 20 newest deployments with pagination to older records; both August previews remain addressable. The exact project retention policy and expiration date are not exposed by the connected response.
- The deployment list marks current production `dpl_7C9...` and its immediate predecessor `dpl_H72a...` as rollback candidates. Vercel's documented rollback path can repoint production to an eligible earlier deployment; deleting a deployment removes instant rollback and can break integration links.
- Recommendation: do not delete any Vercel production or PR-preview deployment during legacy-host retirement. Review and document the retention policy separately before cleanup.

**Traffic and backlink evidence**

- Reachability is verified; traffic volume is not. The connected Vercel tools available here do not expose Web Analytics/referrers.
- Repository references make Vercel canonical in `README.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/AGENT_HANDOFF.md`, and `web/src/app/layout.tsx`.
- One focused external index search returned no exact third-party mention of `sculptor-explorer.vercel.app`; this is limited negative evidence, not proof that backlinks do not exist.

### Inferences

- The live Vercel root directory is very likely `web`: build logs execute the `web` package without a repository-root package, and the maintained deployment table names `web`. The authoritative dashboard field was not exposed.
- Repeated automatic previews on two PR branches strongly support Git integration for PR/non-production branches. The exact ignored-build-step, preview-branch inclusion, and deployment-protection settings remain owner-only.
- Install and output-directory overrides appear unnecessary because Vercel successfully detects npm/Next.js and the repository emits a static export. Whether the dashboard fields are explicitly set or left at defaults is unverified.

### Owner-only Vercel inspection

Use an already signed-in Vercel session; do not enable a feature or save a setting.

1. Open **Vercel → asherzafar's projects → sculptor-explorer → Settings → General**. Record only: Git repository, production branch, root directory, framework preset, install command, build command, output directory, Node version, ignored build step, and deployment-protection setting.
2. Open **Settings → Domains**. Confirm the three domains above and whether any unreturned custom domain exists.
3. Open **Settings → Git**. Record connected repository, production branch, preview-branch rules, and whether comments/checks are enabled.
4. Open **Deployments**, select production `dpl_7C9...` and preview `dpl_Ckw...`, and record any visible expiration/retention label plus eligible rollback action. Do not click Promote, Redeploy, Rollback, or Delete.
5. Open **Web Analytics/Observability** for the longest already-available range (prefer 90 days). If analytics is already enabled, record aggregate visits and top referrers for the canonical domain; if it is off, record “not enabled” and do not enable it.
6. Open **Team Settings → Members** and record only names/roles relevant to project ownership, not emails, tokens, or authentication methods.

These steps are needed because the connected API omits exact build-field overrides, member roles, retention labels, protection rules, and traffic/referrer data.

## Netlify — pre-implementation stale legacy production

### Verified pre-implementation facts

**Ownership and site**

- Existing Netlify CLI account: Asher Zafar, provider user ID `69ddc6c0f7df73e22797a523`. The local credential value was not printed, inspected, changed, refreshed, or copied.
- Account slug/name/type: `asherzafar` / `Asher` / Free; account ID `69ddc6c0f7df73e22797a526`.
- Site: `sculpture-in-data`, site ID `5955b6c3-93dc-45af-b942-b96129178851`, lifecycle `active`, created `2026-04-14T04:51:33.850Z`, last updated `2026-04-19T20:05:24.247Z`.
- Default and only returned domain: `sculpture-in-data.netlify.app`. The API returned no custom domain, domain aliases, branch-deploy custom domain, or deploy-preview custom domain.

**Pre-implementation behavior and staleness**

- Public HEAD requests to `/` and `/timeline` returned HTTP 200 with `server: Netlify`; neither response redirects to Vercel.
- Browser inspection shows the stale five-item navigation: Timeline, Explore, Evolution, Lineage, About. Canonical production has seven items, adding Migration and Transparency.
- The published deployment is `69e534b082b31771426151a0`, created `2026-04-19T20:01:52.182Z` and published `2026-04-19T20:05:18.599Z`, title `Lineage component + empty state`, state `ready`, context `production`, framework `next`.
- The deploy has no build ID, commit ref, commit URL, branch, public repository, review ID, or source zip. Its recorded deploy source is `api`; there are no functions or edge functions.
- Site-level provider `build_settings` is empty. The versioned fallback `web/netlify.toml` says `npm run build`, publishes `out`, and currently applies a catch-all 200 rewrite to `/index.html`; it is not evidence that the site is Git-linked.
- Eight production deployments are returned. The seven older deployments carry `expires_at: 2026-07-14T00:00:00Z`; the currently published deploy has no expiration. Site-level `deploy_retention_in_days` is 90.
- Netlify returns `views_count: null` for deployments and `analytics_instance_id: null` for the site. No provider traffic/referrer evidence is available through this Free account response.

**Repository association**

- The site is not currently connected to a provider-visible repository or branch: `public_repo`, branch, commit ref, and build settings are empty/null.
- The repository added `web/netlify.toml` in commit `8e8a4dac3702be0b75747ef5b99798f404a9153d` on 2026-04-14 and still retains it as a fallback artifact.

**Redirect and rollback options**

- Netlify supports external permanent redirects with wildcard/splat path forwarding. The intended rule is semantically `/*` → `https://sculptor-explorer.vercel.app/:splat`, status 301, preserving query strings. The implementation must replace the current 200 rewrite, not layer the redirect behind it.
- Because the provider project is not Git-linked, editing `web/netlify.toml` alone will not change the public site. A separately authorized production deploy of a minimal redirect artifact is required.
- Record current deploy `69e534...`, its permalink, and the exact restore action before publishing the redirect. Do **not** lock it: Netlify documents a locked deploy as pinning the currently published version and preventing newer deploys from reaching the main site. Once the redirect becomes current production, `69e534...` becomes an eligible previous deploy under the verified 90-day retention policy.
- Netlify's supported rollback is to publish/restore a previous retained deploy. The exact current artifact has no source zip, so provider retention is safer than assuming it can be reconstructed byte-for-byte.
- Official references: [Redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/) and [Manage deploys](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

**Traffic and backlink evidence**

- The site is publicly reachable, which proves exposure but not visits.
- GitHub code search found the legacy URL only in this repository's roadmap on public `main`; the current checkpoint also names it in hosting documentation.
- One focused external index search returned generic Netlify/indexing pages and no exact third-party match. This does not prove zero backlinks.
- With no provider analytics instance or views count, deletion cannot be justified from traffic evidence. A redirect is the conservative treatment of unknown backlinks.

### Inference

- The current deploy almost certainly corresponds to repository commit `145751ce97aa52c07743984cdacefad734d7573a`: its commit time is `2026-04-19T20:01:47Z` and subject `Lineage: component ready, empty-state message, data deferred to Phase 3+`, matching the deploy creation time and shortened title. Netlify did not record a commit ref, so this is not provider-linked proof.

### Owner-only Netlify inspection

The CLI/API supplied the important ownership, deployment, domain, hook, and retention fields. Only existing traffic/referrers and GUI restore-control visibility remain account-screen-only.

1. Open **Netlify → sculpture-in-data → Metrics & Analytics**. If existing data is available, record aggregate requests/pageviews and top referrers for the longest available range. If analytics is unavailable, do not purchase or enable it.
2. Open **Deploys → 69e534b082b31771426151a0**. Confirm that **Publish Deploy** is available as the instantaneous restore action while the deploy remains retained; do not lock, publish, restore, or delete during review. Locking is not a preservation mechanism for this migration because it stops newer production deploys from publishing.
3. Open **Project configuration → Build & deploy → Continuous deployment** only to confirm that no Git repository/production branch is linked and that no deploy hook is active.

## Cloudflare Workers — unexpected service/check

### Verified facts

**Current GitHub integration behavior**

- The GitHub App is `Cloudflare Workers and Pages`, app ID `85455`, slug `cloudflare-workers-and-pages`.
- It creates the check `Workers Builds: sculpture-in-data` on this GitHub repository.
- On PR #1 commit `8bb61a7`, check run `91551090938` failed at `2026-08-02T21:39:50Z` with zero elapsed seconds. It links build `8735cabc-6f56-4eb3-9cfc-3377607f375d`.
- On PR #2 commit `e4596b7`, check run `91556308785` failed at `2026-08-02T22:33:07Z` with zero elapsed seconds. It links the newer build `66789b97-a769-4e06-9d62-6039bf4cb29b`.
- Both checks identify script/service `sculpture-in-data` under Cloudflare account ID `370dc6896c711fc6c8c6801139acd063` and a dashboard `/production/builds/...` path.
- The public GitHub check summaries contain no failure message beyond the failed state and provider build link. The exact Cloudflare pages require login; no Cloudflare login or authentication change was attempted.
- Vercel, Vercel Preview Comments, and both GitHub Actions runs passed on the same exact PR commits. The Cloudflare failure is independent hosting/integration state, not evidence that the repository validation or Vercel preview failed.

**Build configuration and confirmed failure**

- Owner-supplied account screenshots verify a per-Worker Git connection to `asherzafar/sculptor-explorer` with a visible **Disconnect** control.
- Root directory: `/`. Build command: `cd web && npm install && npm run build`. Deploy command: `npx wrangler deploy`. Version command: `npx wrangler versions upload`.
- Production branch: `main`; builds for non-production branches are enabled; include paths are `*`.
- The configured API token is named `sculpture-in-data build token`. No token value was supplied or recorded. Variables/secrets are `None`; no deploy hooks are defined; build cache is enabled.
- The supplied log for build `66789b97-a769-4e06-9d62-6039bf4cb29b` verifies that repository clone, dependency install, Next.js compilation, TypeScript, and generation of 3,625 static pages all succeeded.
- The failure occurs only at deployment. Cloudflare ran `npx wrangler versions upload`, installed Wrangler `4.118.0`, and failed at `2026-08-02T22:33:05Z` with `Missing entry-point to Worker script or to assets directory`.
- This confirms the current cause: the stale build settings still invoke Wrangler after the repository intentionally removed its Wrangler configuration. It is not the former 20,000-file manifest limit and not a failed application build.

**Historical configuration and failure**

- Commit `b3f5bcf38a47e519eaae197cabfbe0eb695633a2` added a static-assets-only Worker named `sculpture-in-data`, compatibility date `2026-04-24`, asset directory `./web/out`, 404-page handling, Node 20, and no Worker script.
- Commit `05aeb384486987844ba98cfb22afb95a69ecb1df` moved `wrangler.toml` to the repository root because Cloudflare built from the repository root.
- Commit `02ad5b38fafdf59ba9aa498c8e256ca3cc02ca80` removed `wrangler.toml` and made Vercel canonical after a successful Cloudflare build could not deploy the roughly 32,000-file artifact through the then-free 20,000-file manifest limit.
- The current static export is even larger (36,201 files in the checkpoint evidence), and the current repository has no Wrangler configuration.
- Official references: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Workers Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/), and [versions/deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/).

**Domains, traffic, ownership, retention, and rollback**

- Owner-supplied screenshots verify that both `sculpture-in-data.asherzafar.workers.dev` and `*-sculpture-in-data.asherzafar.workers.dev` are disabled. There are no custom domains and no zone routes.
- The dashboard shows active manually deployed version `cf3a4cff` receiving 100% of version traffic, deployed about three months earlier. It shows `0 req/sec`, 0% error rate, 0 ms median CPU, and `No data` at capture time.
- Prior manually deployed version `2da29370` is retained. The dashboard states that Workers versions support rollback to the last 100 saved versions.
- Recent build history shows repeated failed Git builds across `main` and non-production branches. The active deployment remains the manual version; the supplied failed builds did not replace it.
- The supplied 30-day CSV is named `all_sites_for_account_2026-08-02T23_34_25.095Z.csv` and totals 944 requests by country. Because it contains no service, hostname, route, or timestamp field and is explicitly account-scoped, it does **not** prove that this Worker received 944 requests or that it received zero requests.
- Current service reachability is disabled by configuration, but service-scoped historical traffic and the last request timestamp remain to be verified through the Cloudflare API MCP before deletion.
- The account owner attests that they are the only owner/administrator. The email address is intentionally not recorded.
- A focused external index search found no exact public result connecting this service to a serving hostname. This remains limited negative evidence, not proof of no historical backlink.

### Inferences

- The repository integration is confirmed, not inferred: it includes `main` and non-production branches and is the source of the repeated failed checks.
- The active manual deployment may have served requests before its Worker URLs were disabled. The screenshots do not establish when the URLs were disabled or which service generated the account-scoped requests.
- Disconnecting the Git integration should not alter the retained manually deployed versions or domain toggles, but this must be verified in Cloudflare immediately after the provider action.

### Remaining Cloudflare API verification

The owner-screen checklist is complete enough to separate integration retirement from service deletion. The newly installed Cloudflare plugin registers the official Cloudflare API MCP server, but its tools are unavailable to this task because the plugin was installed after the task started. Codex documentation states that installed plugin skills and tools load in a new task.

In the next task, use the Cloudflare MCP read-only before mutation to verify:

1. Exact full version/deployment identifiers and timestamps for `cf3a4cff` and `2da29370`.
2. Service-scoped requests, served hostnames, and last request time for at least the prior 30 days; do not substitute the account-scoped 944-request CSV.
3. Current Worker URL, custom-domain, and route state through the API.
4. Whether the per-Worker Git disconnect preserves the active manual deployment and what happens to the named build token.

No further account screenshot is required unless the MCP contradicts or omits these fields.

## Retention and rollback summary

| Surface | Verified retained recovery point | Current limitation | Safe implementation gate |
|---|---|---|---|
| Vercel production | Current production and immediate predecessor are marked rollback candidates; older deployments remain listed. | Exact plan/policy and preview expiration are owner-only. Specific-target rollback may depend on plan. | Make no Vercel change; record policy before any future cleanup. |
| Vercel previews | PR #1 and PR #2 immutable URLs and branch aliases are still live/READY. | Exact expiration is unknown. | Keep both while visual/workflow review remains open. |
| Netlify redirect | Current production `6a6fcf32...` is the verified redirect; old deploy `69e534...` is still reachable at its immutable permalink and the API exposes `restoreSiteDeploy`. | The old deploy now reports the already-past expiration `2026-07-19T00:00:00Z` and may disappear without warning; its source archive is unavailable. | Retain the redirect. Restore `69e534...` only while it remains available and only if a redirect regression requires emergency rollback. |
| Cloudflare | Active manual version `cf3a4cff` receives 100% of version traffic; prior manual version `2da29370` is retained; the UI supports rollback among the last 100 saved versions. | Both Worker URLs are disabled and there is no custom route/domain, but the 944-request CSV is account-scoped rather than service-scoped. Exact full version IDs and service traffic remain MCP-verification items. | Disconnect only the per-Worker Git build integration after explicit approval; retain the service and versions for at least 30 days. Do not delete until the MCP verifies service-scoped traffic and current routing. |

## Proposed implementation sequence after review

1. Complete the narrow owner-only checklist and append the observations to this inventory before the corresponding provider mutation. A missing authenticated account screen is a failed gate, not evidence of absence. Stop that provider's mutation if it shows an unrecorded custom domain, meaningful traffic/backlink, required check, or additional owner.
2. Leave Vercel untouched. Re-verify the canonical alias immediately before and after legacy-host work. Treat a new legitimate `main` production deployment as drift to record and review, not as a reason to roll Vercel back to the inventory's deployment ID.
3. On Netlify, record deploy `69e534...` and the exact `restoreSiteDeploy` call; do not lock it. Create a versioned minimal `_redirects` artifact containing the forced rule `/* https://sculptor-explorer.vercel.app/:splat 301!`. Publish it first as an immutable draft, verify root, representative nested paths, missing paths, and query strings, and only then deploy the identical directory to production. If any production check fails, immediately restore `69e534...` and verify the rollback. Observe for 90 days; retain the redirect indefinitely by default.
4. On Cloudflare, use the newly installed API MCP in a fresh task to verify service-scoped traffic, full version IDs, current routing, and disconnect semantics. The screenshots already verify disabled Worker URLs, no custom route/domain, a retained manual deployment, a per-Worker disconnect control, and a non-required GitHub check. After explicit approval, disconnect only the Git build integration, preserve the service and manual versions for at least 30 days, and verify check absence on the next separately authorized PR. Service deletion is a later decision with a stricter traffic gate.
5. Record exact changes, timestamps, tests, rollback references, and observation end dates. Do not combine provider retirement with Node 24, route, roadmap, handoff, or visual changes.

## Rigorous implementation review

The first implementation prompt was not safe enough to execute unchanged. The corrected contract below resolves four issues:

1. **Netlify locking was counterproductive.** Official Netlify documentation defines locking as pinning the current production deploy so that newer deploys do not publish. The safe sequence is an immutable draft, verification, an identical production deploy, and an immediate `restoreSiteDeploy` rollback on failure.
2. **The Cloudflare test-PR step exceeded the publishing boundary.** A new test PR requires a commit and push, both expressly withheld. This pass may verify the provider-side disconnect only; GitHub check absence belongs to the next already-authorized PR.
3. **The Vercel deployment ID is an observation, not a rollback target.** Parallel work may legitimately advance `main`. A changed canonical deployment must be recorded and reviewed, never silently reverted merely to match this dated inventory.
4. **The branch instruction referenced a nonexistent committed checkpoint.** The inventory is intentionally uncommitted. The retirement branch must be created at approved base `e4596b7...` while carrying this uncommitted inventory, and the exact state must remain uncommitted for review.

## Executed implementation prompt — historical record

Do not run this prompt again. It is retained to audit the authority used for the completed Netlify migration and the fail-closed Cloudflare decision at that time.

```markdown
Implement the reviewed Phase 5Q.4c hosting retirement for Sculpture in Data from `docs/HOSTING_INVENTORY_2026-08-02.md`.

Create `codex/phase-5q4c-hosting-retirement` at approved base `e4596b7a88355b680570d7203c6781f0985730c3` while carrying the reviewed but intentionally uncommitted inventory file. Treat verified provider IDs and public evidence as dated preflight inputs; re-read live state before mutation. Do not edit shared roadmap/handoff files, commit, push, open a PR, create a test branch, change authentication, or expose any token, secret, environment-variable value, password, cookie, or credential material.

Authority is limited to this sequence:

1. **Vercel — read-only invariant.** Make no Vercel project, production, domain, deployment, preview, retention, or integration change. Before and after the legacy-host work, resolve `https://sculptor-explorer.vercel.app` through the connected Vercel provider and public HTTP. Record its current production deployment, repository, branch, and commit. If it no longer maps to `dpl_7C9BUQyu8CEoAhZe9J2wSU7cpix5`, do not roll back or promote anything; record the drift and stop any action whose safety depends on the old ID.
2. **Netlify — draft-gated redirect with immediate rollback.** Re-read site `5955b6c3-93dc-45af-b942-b96129178851` and confirm its current published deploy before mutation. If it is not `69e534b082b31771426151a0`, stop and review the drift. Record that deploy's permalink and the exact rollback call `netlify api restoreSiteDeploy --data '{"site_id":"5955b6c3-93dc-45af-b942-b96129178851","deploy_id":"69e534b082b31771426151a0"}'`; do not lock it, because locking pins current production and blocks the redirect publication. Add only a versioned minimal redirect artifact at `hosting/netlify-redirect/_redirects` containing `/* https://sculptor-explorer.vercel.app/:splat 301!`. Deploy that directory first as a draft with no build, record its deploy ID/permalink, and verify `/`, `/timeline`, `/about?source=legacy`, and `/missing/nested/path` return 301 to the exact Vercel path while preserving the query string. Confirm the followed destinations return 200 for the three real routes and the canonical site's expected 404 for the missing route. Only if every draft check passes, deploy the identical directory to production with no build. Re-run the same public checks against `sculpture-in-data.netlify.app`. If any required production status or `Location` is wrong, immediately restore `69e534...` and verify the stale site is serving again. Do not delete the Netlify project or change its domain, repository link, build settings, retention, or analytics. Record a 90-day observation end date of 2026-10-31 and retain the redirect indefinitely by default. Re-read the old deploy's `expires_at` after publication and report it exactly; do not imply the observation window guarantees rollback availability.
3. **Cloudflare — conditional per-service integration retirement.** Use an already signed-in account screen, if available, for account `370dc6896c711fc6c8c6801139acd063` and service `sculpture-in-data`. Read build `66789b97-a769-4e06-9d62-6039bf4cb29b`, connected repository/branches, build commands/root, every domain and route, active and successful versions, the longest available traffic window (minimum 30 days), service owners, retention/rollback choices, and GitHub required-check rules. Do not treat an unavailable screen or unavailable analytics as zero. Disconnect only this service's repository Workers Builds integration if and only if all gates prove: no serving hostname/route, zero requests in the inspected window, no required-check dependency, no additional owner requiring coordination, no successful deployment worth retaining, and the UI supports a per-service disconnect without uninstalling the GitHub App globally. Verify the disconnected state in Cloudflare and retain the service unchanged for 30 calendar days after the recorded disconnect (through 2026-09-01 only if disconnected on 2026-08-02). Do not create or push a test PR in this task; record check-absence verification as a required assertion on the next separately authorized PR. If any gate fails or cannot be inspected, make no Cloudflare change and give narrow exact owner-screen instructions for the missing fact. Never delete the service in this task.
4. **Record and validate.** Append a timestamped implementation review and provider-change log to this inventory with before/after IDs, exact public HTTP results, observation dates, rollback action, mutations made, mutations withheld, and known unknowns. Run documentation-only checks (`git diff --check`, local-link/path verification, complete diff inspection) and show the uncommitted status.

Finish **REVIEW READY — keep open** with the local diff, external changes made, verification evidence, rollback action, known unknowns, and this exact follow-up boundary: retain Vercel unchanged; retain the Netlify redirect; verify Cloudflare check absence on the next already-authorized PR if disconnected; 30 calendar days after the recorded Cloudflare disconnect, seek separate approval either to delete the route-less/traffic-less service or retain/redirect it if evidence changed. Do not commit or push until I explicitly approve.
```

## Approved implementation result

### Timestamped provider-change log

| Time (UTC) | Surface | Before | Action | After / verification |
|---|---|---|---|---|
| 2026-08-02 23:12 | Vercel | Canonical alias mapped to `dpl_7C9BUQyu8CEoAhZe9J2wSU7cpix5`, `READY`, production, `asherzafar/sculptor-explorer`, `main@5b2d621...`; `/` and `/timeline` returned 200. | Read-only preflight; no mutation. | Same provider identity and public 200 responses after Netlify work at 23:17 UTC. |
| 2026-08-02 23:12 | Netlify | Published deploy `69e534b082b31771426151a0`; legacy `/`, `/timeline`, and `/about?source=legacy` returned 200; no custom domain, Git build settings, analytics instance, or build hook. | Created draft deploy `6a6fcee9884a456b55725cda` from the one-file redirect directory; no build. | Draft returned exact 301 locations for `/`, `/timeline`, `/about?source=legacy`, and `/missing/nested/path`; the query string was preserved. Followed real destinations returned 200 and the missing canonical destination returned 404. |
| 2026-08-02 23:13 | Netlify | Draft gate passed; redirect file Git blob hash `262d692295226f7fe197ea1ab52cfe78551f4c91`. | Published the identical directory to production as deploy `6a6fcf32abb0f784cf680335`; no build. | `sculpture-in-data.netlify.app` now returns the same exact four 301 locations. Followed destinations are 200/200/200/404 as expected. Current deploy is `ready`, production, and has no expiration while published. |
| 2026-08-02 23:15 | Netlify rollback | Old deploy `69e534...` remained reachable at its immutable permalink with HTTP 200. | No rollback invoked because every production check passed. | API now reports `expires_at: 2026-07-19T00:00:00Z` for the old deploy, a date already past. It is a currently reachable but fragile rollback point and may disappear on Netlify's deletion schedule without further warning. |
| 2026-08-02 23:15 | Cloudflare | Owner-only domains, versions, traffic, build error, owners, and retention remained unknown. | Attempted the exact dashboard inspection in the available account-capable browser surface; navigation was unavailable. Applied the fail-closed gate. | No Cloudflare build, route, deployment, integration, service, authentication, or deletion change. |
| 2026-08-02 23:16 | GitHub / Cloudflare gate | `Workers Builds: sculpture-in-data` failed on both inspected PR commits. | Read-only repository policy check. | Repository ruleset list is empty and `main` returns “Branch not protected”; the Cloudflare check is not a required GitHub check. No test PR was created. |
| 2026-08-02 23:34 | Cloudflare owner evidence | Build settings, domains, deployments, analytics export, and sole-owner attestation were supplied. | Read-only inspection of the supplied log, screenshots, and CSV; no provider mutation. | Confirmed stale Git settings and exact deploy-stage failure; disabled Worker URLs; no custom route/domain; active manual version `cf3a4cff`; prior version `2da29370`; and an account-scoped 30-day total of 944 requests that cannot be attributed to this Worker. |
| 2026-08-02 23:42 | Cloudflare MCP readiness | Cloudflare plugin `0.1.2` is installed and registers the official API MCP, but this already-running task exposes no Cloudflare tools. | Read-only plugin/resource and Codex configuration inspection; no login or configuration change. | A new task is required to load the plugin tools. OAuth may be requested on first Cloudflare tool use. Direct Codex CLI configuration does not contain a separately registered `cloudflare` server; no duplicate server was added. |

### Netlify implementation artifact and rollback

- Versioned redirect artifact: `hosting/netlify-redirect/_redirects` with the single forced rule `/* https://sculptor-explorer.vercel.app/:splat 301!`.
- Observation end: **2026-10-31**. This is an observation date, not a promise that the old deploy remains restorable.
- Preferred steady state: retain current redirect deploy/site indefinitely. The current published redirect and most recent successful production deploy are protected classes under Netlify's documented retention behavior.
- Emergency rollback while `69e534...` remains retained:

  ```bash
  netlify api restoreSiteDeploy --data '{"site_id":"5955b6c3-93dc-45af-b942-b96129178851","deploy_id":"69e534b082b31771426151a0"}'
  ```

  The API method schema and old permalink were verified, but the rollback action was intentionally not invoked after a successful production migration because it would revert the public redirect. Re-run the four legacy public checks immediately after any rollback.

### Cloudflare decision boundary after owner evidence

- **Safe after explicit approval:** disconnect the Git repository from this Worker using the per-Worker **Disconnect** control, provided the fresh MCP preflight still shows no active Worker URL, custom domain, or zone route and confirms that the active manual deployment remains retained.
- **Not authorized or justified:** retrying builds, restoring Wrangler configuration, adding a redirect, proxying Vercel through Cloudflare, enabling Worker URLs, deleting versions, revoking the named API token manually, or deleting the service.
- **Retention clock:** begins when the Git integration is actually disconnected, not when this inventory was written.
- **Deletion gate:** after at least 30 days, require service-scoped request/hostname evidence from the Cloudflare MCP and confirmation that the next authorized PR no longer receives `Workers Builds: sculpture-in-data`.
- **No Cloudflare redirect is needed now:** both `workers.dev` surfaces are disabled and there is no custom hostname or route to preserve.

### Validation

- Branch/base: `codex/phase-5q4c-hosting-retirement` at `e4596b7a88355b680570d7203c6781f0985730c3`.
- Redirect artifact: exactly one line and Git blob hash `262d692295226f7fe197ea1ab52cfe78551f4c91`.
- Whitespace: `git diff --check` passed for tracked changes; `git diff --no-index --check /dev/null <path>` produced no whitespace errors for each untracked deliverable (the expected exit status is 1 because each file differs from `/dev/null`).
- References: every repository path named by this document's implementation and evidence sections exists locally; Markdown code fences are balanced.
- Review: the complete inventory and the byte-level one-line redirect artifact were inspected after the provider work and again after the owner-supplied Cloudflare evidence.
- Pre-publication worktree gate: only `docs/HOSTING_INVENTORY_2026-08-02.md` and `hosting/netlify-redirect/_redirects` were untracked; nothing else was staged or modified before founder approval to commit and push.

### Exact follow-up prompt

```markdown
Use the installed Cloudflare plugin to complete the read-only Phase 5Q.4c API verification for account `370dc6896c711fc6c8c6801139acd063` and Worker `sculpture-in-data`, using `docs/HOSTING_INVENTORY_2026-08-02.md` on `codex/phase-5q4c-hosting-retirement` as the evidence baseline.

Authenticate through the plugin's OAuth flow if Codex requests it. Do not add duplicate MCP servers, expose credentials, edit authentication, or change Vercel, Netlify, GitHub, Cloudflare settings, routes, domains, versions, deployments, tokens, or integrations.

Through the Cloudflare API MCP, verify: (1) exact full IDs and timestamps for active version `cf3a4cff` and prior version `2da29370`; (2) current Worker URL, custom-domain, and zone-route states; (3) service-scoped requests, served hostnames, and last request time for at least the previous 30 days; (4) the Git repository/build configuration and whether a per-Worker disconnect preserves the active manual deployment; and (5) the status/ownership implications of the named build token without reading its value.

Reconcile MCP facts with the supplied owner screenshots and the account-scoped 944-request CSV. Treat any conflict or unavailable service-scoped analytics as unknown. Make no provider mutation. Finish REVIEW READY — keep open with the exact disconnect preflight, rollback/retention implications, and one explicit approval question for disconnecting only this Worker's Git build integration. Do not commit or push.
```

## Task status

**COMPLETE — safe to archive after the approved branch publication**

Recommended decisions: **Vercel — no change; Netlify — retain the implemented path-preserving 301 indefinitely; Cloudflare — after a fresh MCP preflight and explicit approval, disconnect only the per-Worker Git build integration, retain the disabled Worker and manual versions for at least 30 days, and defer deletion until service-scoped traffic and next-PR evidence pass.** Netlify production changed only as recorded above; Vercel and Cloudflare did not change.
