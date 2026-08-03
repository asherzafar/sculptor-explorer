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

## Time-bounded acceptances

| Dependency path | Finding | Reachability decision | Treatment |
|---|---|---|---|
| `next → postcss@8.4.31` | Untrusted source-map/CSS input can trigger style injection or file disclosure ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849)) | Build-time only; the build consumes trusted repository CSS and deploys static output. There is no production CSS parser or upload path. | Accept through 2026-09-02; upgrade when Next ships a compatible patched PostCSS. Reopen immediately if CSS becomes user-controlled. |
| `next → sharp@0.34.5` | Inherited libvips vulnerabilities ([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)) | Optional build dependency. The static site disables Next image optimization, hot-links source images, and exposes no runtime image-processing endpoint. | Accept through 2026-09-02; upgrade with Next/Sharp when compatible. Reopen if local or uploaded images enter an optimization pipeline. |
| `shadcn` CLI tree | Hono, MCP SDK, Express, `qs`, `fast-uri`, and Babel findings | Development-only CLI/build tooling; none of these packages serves public traffic. The committed site imports only shadcn's build-time Tailwind CSS. | Keep development-only; update during the monthly review and do not run the CLI on untrusted projects or input. |
| ESLint/build tree | `brace-expansion`, `js-yaml`, and Babel findings | Development-only tools operating on trusted repository files. | Update normally when compatible; do not use `npm audit fix --force` because the proposed graph rewrite is not a safe substitute for reachability review. |

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
