# Sculpture in Data — AI Agent Entry Point

> All current values (colors, fonts, routes, rules) live in **`.windsurfrules`**. Read it first.

## For Windsurf/Cascade
`.windsurfrules` is loaded automatically. It is the single source of truth for all decisions.

## For other AI agents (Claude Code, Copilot, etc.)
Read `.windsurfrules` in the repo root. It contains the full palette, font stack, routing, coding rules, and current phase.

## Deep-dive docs
| Doc | What it covers (rationale & patterns, not values) |
|-----|---------------------------------------------------|
| `docs/DESIGN_SYSTEM.md` | Design philosophy, accessibility rules, component behavior |
| `docs/ARCHITECTURE.md` | Data flow, SPARQL queries, JSON schemas, TypeScript interfaces |
| `docs/ROADMAP.md` | Phased plan, task status, what to build vs. defer |

Values in these docs **reference** `.windsurfrules`. If anything conflicts, `.windsurfrules` wins.