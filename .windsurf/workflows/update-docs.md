---
description: Update documentation when a design or architecture decision changes
---

# Update Docs Workflow

When a design decision changes (color, font, route, rule, tech stack version, etc.):

1. **Update `.windsurfrules`** — this is the ONLY place values live.
   - Colors, fonts, routes, rules, current phase, landing redirect target.

2. **Check `CLAUDE.md` and `README.md`** — these should rarely need changes since they point to `.windsurfrules`. Update only if:
   - The app name changed
   - The quick-start command changed
   - The project structure fundamentally changed

3. **Do NOT add values to spoke docs** — `docs/DESIGN_SYSTEM.md` and `docs/ARCHITECTURE.md` describe rationale and patterns, not values. They reference `.windsurfrules` for current values. If you're tempted to write a hex code or route list in a spoke doc, add a `> see .windsurfrules § [section]` reference instead.

4. **Update `docs/ROADMAP.md`** if the change affects phasing or task status.

## Hub-and-spoke principle

- **Hub (`.windsurfrules`):** WHAT — all current values and rules
- **Spokes (`docs/*.md`):** WHY and HOW — rationale, patterns, schemas
- **Pointers (`CLAUDE.md`, `README.md`):** Entry points that link to the hub
