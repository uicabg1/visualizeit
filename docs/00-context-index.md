# VisualizeIT Context Index

Purpose: documentation index for loading only what is needed for the current phase.

## Project Decision

VisualizeIT will be built as a modular technical visualization platform, but the MVP is intentionally narrow:

> Build one excellent interactive experience first: the Low-Level Memory Engine for C memory visualization.

IPv6/SLAAC, discrete mathematics, and Explainable AI remain future modules.

## Phase Status

| Phase | Status | Completed |
|-------|--------|-----------|
| Phase 1 — Deterministic Simulation Foundation | ✅ DONE | 2026-05-03 |
| Phase 2 — Interactive Canvas Visualizer | ✅ DONE | 2026-05-04 |
| Phase 2.1 — alg0.dev Visual Alignment | ✅ DONE | 2026-05-10 |
| Phase 2.2 — Brand Identity & Visual Refinement | ✅ DONE | 2026-05-11 |
| Phase 2.5 — Content Expansion + Production Launch | 🔵 ACTIVE | T1–T16 done 2026-05-12; T17 in flight |
| Phase 3 — WASM Acceleration | ⏳ NOT STARTED | — |

**Phase 2.5 scope:** 8 scenarios with real C code + per-step line highlighting, recursive- and diagnostic-aware pedagogy (49 tests), ResizeObserver canvas, `/about` page, welcome overlay, keyboard shortcuts, shareable URL state, Share button, step dots, fullscreen canvas mode. Deployed to https://visualizeit-two.vercel.app. Forward queue in [`docs/roadmap/backlog.md`](roadmap/backlog.md).

## Documentation Index

### Architecture

System design, project scaffolding, technical structure:

- `docs/architecture/01-system-architecture.md`
- `docs/architecture/02-directory-structure.md`
- `docs/architecture/03-performance-and-simulation-strategy.md`

### MVP Product Scope

UI flows, component planning, feature breakdown:

- `docs/mvp/01-memory-engine-functional-spec.md`
- `docs/mvp/02-memory-engine-roadmap.md`

### Phase 2.5 Active Work

Task backlog, session handoffs, current state:

- `docs/roadmap/backlog.md`
- `docs/handoffs/2026-05-12-phase-2-recursive-stack-context.md`
- `docs/checkpoints/current-state.md`

Key source files:

- `features/memory-engine/simulation/fixtures.ts` — scenario definitions
- `components/memory/MemoryWorkspace.tsx` — main orchestrator

### Future Expansion

- `docs/future-modules/01-expansion-backlog.md`

## Guardrails

- Do not implement future modules during the Memory Engine MVP.
- Do not put model inference inside the render loop or simulation loop.
- Do not use 3D for the memory engine unless there is a clear learning benefit.
- Keep implementation focused on one phase at a time.
