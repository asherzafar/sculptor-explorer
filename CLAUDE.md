# Sculpture in Data — Project Conventions

> An interactive web app exploring how sculpture evolved over time.

## For AI agents
**Windsurf/Cascade:** `.windsurfrules` is loaded automatically — it has rules, hex values, fonts, and gotchas. Reference `docs/` for deeper detail.

## Quick reference
- **App name:** Sculpture in Data
- **Stack:** Python pipeline → JSON → Next.js 15 + D3 + Tailwind → Vercel (static export)
- **Fonts:** Fraunces (display) + DM Sans (body)
- **Palette:** Verdigris & Marble (accent #3D7A68, bg #FAFAF9, sidebar #F0F1EE)
- **Charts:** D3 in React wrappers. NOT Recharts.
- **Current phase:** Applying design system to existing codebase

## Project docs
| Doc | Covers |
|-----|--------|
| `.windsurfrules` | Critical rules, colors, fonts, Next.js gotchas |
| `docs/DESIGN_SYSTEM.md` | Full visual spec |
| `docs/ROADMAP.md` | Phased plan, MVP scope |
| `docs/ARCHITECTURE.md` | Stack, queries, TypeScript interfaces |