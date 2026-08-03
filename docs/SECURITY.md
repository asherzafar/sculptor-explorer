# Security and Dependency Triage

**Reviewed:** 2026-08-02  
**Next mandatory review:** 2026-09-02, or sooner if the deployment stops being
a static export, source inputs become user-controlled, or Next.js publishes a
compatible transitive patch.

## Deployment boundary

The public application is a Next.js static export (`output: "export"`) with
image optimization disabled. It has no Server Actions, middleware/proxy,
custom server, authentication, write API, or runtime CSS/image-processing
endpoint. Source data and CSS are repository-controlled at build time; museum
and Commons images are hot-linked rather than passed through a deployed image
optimizer.

That boundary does not erase dependency findings, but it changes which attack
paths are reachable in production.

## 2026-08-02 result

- Upgraded the direct production dependency from Next.js 16.2.3 to 16.2.12.
  This patches the audit's direct Next.js server-component, cache,
  middleware/proxy, Server Action, and SSRF advisories without a major-version
  change.
- Aligned `eslint-config-next` to 16.2.12 so lint rules and framework behavior
  are reviewed and upgraded as one release pair.
- Moved the `shadcn` command-line package from production dependencies to
  development dependencies. Its CSS is consumed at build time; its CLI,
  Model Context Protocol server, Hono, and Express dependencies are not
  shipped as an application server.
- Full `npm audit`: 14 package-level findings (2 low, 5 moderate, 7 high),
  no critical findings. Eleven are development-tool findings.
- `npm audit --omit=dev`: 3 high package-level findings: Next.js is counted
  through its bundled PostCSS and optional Sharp dependencies.

## 2026-08-03 dependency and advisory closeout

- Vulnerability alerts and Dependabot security updates remain enabled; no
  dependency auto-merge is enabled.
- Compatible package families landed one at a time in this exact order: PRs
  #17, #13, #15, #14, #18, #19, #12, #10, and #8. React landed before React DOM
  so the peer contract was valid on every merged graph.
- Focused PR #20 updated the remaining vulnerable transitive Babel, Hono,
  body-parser/type-is, brace-expansion, js-yaml, PostCSS, and Sharp/libvips
  paths. It did not run `npm audit fix --force` or downgrade stable Next.js.
- On the merged dependency-closeout baseline `674f65884d622f8fabb509e43d651cf67188717b`,
  `npm audit` and `npm audit --omit=dev` both report zero vulnerabilities, and
  GitHub reports zero open Dependabot alerts.
- The complete local validation gate and all seven Playwright journeys passed;
  the exact PR head and merged `main` each passed GitHub Actions and exact-SHA
  Vercel preview/production verification.

## Current dependency controls and review triggers

| Dependency path | Current treatment | Review trigger |
|---|---|---|
| `next → postcss` | `overrides.postcss` selects patched `8.5.25` while stable Next 16.2.12 still declares the older vulnerable transitive generation. Builds and audits pass. | At the 2026-09-02 review or the next stable Next release, whichever is sooner, test whether Next incorporates an equally new patched PostCSS and remove the override only after clean install, full validation, browser tests, audits, and preview proof. Reopen immediately if CSS input becomes user-controlled. |
| `next → sharp` | `overrides.next.sharp` selects patched `0.35.3`. The static export still disables image optimization and exposes no runtime processor. | Reassess with the next stable Next graph or if local/uploaded images enter an optimization pipeline. Remove only after equivalent validation; do not trade the override for a vulnerable or incompatible graph. |
| `shadcn` CLI and lint/build tooling | Patched transitive MCP SDK, Hono, Express, `qs`, `fast-uri`, Babel, brace-expansion, and js-yaml versions are locked; the CLI remains development-only. | Review monthly and whenever Dependabot or GitHub opens a new advisory. Do not run tooling on untrusted repositories/input, and do not auto-merge split package families. |

The override is a temporary compatibility control, not permission to ignore
future upstream releases. Its retirement is a normal dependency PR with the
same exact-head and post-merge production gates as any other change.

## Verification commands

Run from `web/`:

```bash
npm audit
npm audit --omit=dev
npm ls next postcss sharp shadcn
```

Then run `./scripts/validate.sh` from the repository root and
`cd web && npm run test:e2e` for the explicit browser gate. Security review is
incomplete if an upgrade has not also passed the data, type, lint, build,
interaction, and bounded performance checks.
