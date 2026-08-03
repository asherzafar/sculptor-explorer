---
name: visual-qa
description: Preview, inspect, audit, critique, QA, or validate a rendered interface in this repository. This workflow is read-only unless the user explicitly requests implementation.
---

# Visual QA for a rendered interface

This is an instruction-only repository workflow. `AGENTS.md`, the design and
research standards, and the dated visual baseline remain authoritative.

## Evidence and authorization

- Remain read-only unless the user explicitly requests implementation.
- Prefer the Vercel Preview Deployment associated with the current pull
  request and exact commit. Verify that association rather than trusting a
  similar-looking URL. Do not promote or redeploy production.
- Use available browser or computer-use capabilities for rendered evidence.
  Distinguish what was directly observed, inferred from source/DOM, covered by
  automation, or not testable with the available surface.

## Workflow

1. Read `AGENTS.md`, `.windsurfrules`, `docs/PROJECT_CHARTER.md`,
   `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`,
   `docs/RESEARCH_FOUNDATIONS.md`, the relevant route documentation, the
   current `docs/VISUAL_BASELINE_2026-08-02.md`, and
   `docs/AGENT_HANDOFF.md`.
2. Resolve the intended PR, branch, commit, routes, reader tasks, and preview
   deployment. Record the preview access boundary and exclude hosting toolbar
   chrome from product findings.
3. Inspect at minimum 1440 x 900 and 390 x 844. Add the other widths, zoom,
   text-spacing, forced-colors, color-vision, reduced-motion, and assistive-
   technology checks required by the current route gate.
4. Exercise the relevant navigation, links, search/filter/sort controls,
   selections, keyboard interaction, visible focus, URL-state restoration,
   loading states, empty states, error/degraded-data states, and share path.
5. Inspect browser console warnings and errors. Record route, action, and
   viewport for any message.
6. Evaluate the reader question and answer, information hierarchy, density,
   legibility, responsive behavior, accessibility/equivalent path, design-
   system consistency, data provenance, uncertainty/missingness, interaction
   latency, and perceptual stability.
7. Run the existing Playwright journeys. Treat them as regression evidence,
   not a substitute for perceptual, keyboard, screen-reader, or comprehension
   review.
8. Recommend new automated regression tests only for stable, consequential
   behavior. Do not snapshot incidental pixels, force-layout coordinates, or
   unstable hosting chrome.

## Finding format

Separate:

- **Confirmed defects:** directly reproduced failures.
- **Probable defects:** strong evidence, but an unavailable environment,
  assistive technology, account state, or reproduction step prevents full
  confirmation.
- **Design opportunities:** alternatives or hypotheses that need evaluation,
  not defects disguised as preference.

For each finding include severity, confidence, route, viewport/environment,
steps, expected/observed result, evidence, affected task, and suggested next
test or fix boundary. Preserve positive evidence about patterns that should
remain so an audit does not become a one-sided restyle brief.

## Final report

Report:

- task status and whether the QA task is safe to archive;
- branch, commit, PR, and preview URL audited;
- coverage matrix and untested boundaries;
- confirmed/probable/opportunity findings in priority order;
- Playwright and console results;
- whether the route gate passes, fails, or remains incomplete; and
- the exact seed prompt for the next bounded implementation or audit task.
