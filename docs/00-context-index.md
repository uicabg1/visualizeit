# VisualizeIT Context Index

Purpose: documentation index for loading only what is needed for the current phase.

## Project Decision

VisualizeIT will be built as a modular technical visualization platform, but the MVP is intentionally narrow:

> Build one excellent interactive experience first: the Low-Level Memory Engine for C memory visualization.

IPv6/SLAAC, discrete mathematics, and XAI remain future modules.

## Phase Status

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1 — Deterministic Simulation Foundation | ✅ DONE | 2026-05-03 |
| Phase 2 — Interactive Canvas Visualizer | ✅ DONE | 2026-05-04 |
| Phase 2.1 — alg0.dev Visual Alignment | ✅ DONE | 2026-05-10 |
| Phase 2.2 — Brand Identity & Visual Refinement | 🔵 ACTIVE | 2026-05-11 |
| Phase 3 — WASM Acceleration | ⏳ NOT STARTED | — |

## Token-Saving Method

Use small context packs to keep sessions focused.

### Context Pack A: Architecture

Use when asking for system design, project scaffolding, or technical structure.

Include:

- `README.md`
- `docs/architecture/01-system-architecture.md`
- `docs/architecture/02-directory-structure.md`
- `docs/architecture/03-performance-and-simulation-strategy.md`

### Context Pack B: MVP Product Scope

Use when asking for UI flows, component planning, or feature breakdown.

Include:

- `README.md`
- `docs/mvp/01-memory-engine-functional-spec.md`
- `docs/mvp/02-memory-engine-roadmap.md`

### Context Pack C: Implementation Planning

Use when creating a coding plan.

Include:

- `docs/architecture/02-directory-structure.md`
- `docs/architecture/03-performance-and-simulation-strategy.md`
- `docs/mvp/01-memory-engine-functional-spec.md`
- `docs/mvp/02-memory-engine-roadmap.md`

### Context Pack D: Future Expansion

Use only after the memory MVP is working.

Include:

- `README.md`
- `docs/future-modules/01-expansion-backlog.md`

### Context Pack F: Phase 2.2 Brand Identity & Visual Refinement

Use when executing or planning Phase 2.2 tasks (brand tokens, canvas transitions, scenario stack focus).

Include:

- `docs/checkpoints/current-state.md`
- `docs/handoffs/2026-05-11-phase-2-2-brand-identity.md`
- `docs/handoffs/2026-05-11-phase-2-2-canvas-transitions.md`
- `docs/handoffs/2026-05-11-phase-2-2-scenario-stack-focus.md`

## Guardrails

- Do not implement future modules during the Memory Engine MVP.
- Do not put model inference inside the render loop or simulation loop.
- Do not use 3D for the memory engine unless there is a clear learning benefit.
- Keep implementation focused on one phase at a time.
