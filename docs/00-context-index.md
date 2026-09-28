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
| Phase 2.5 — Content Expansion + Production Launch | 🔵 ACTIVE | T1–T17b + T-UX-1 + T-CONTENT-1 done 2026-05-14 |
| Phase 3 — WASM Acceleration | ⏳ NOT STARTED | — |

**Phase 2.5 today:** 8 scenarios (incl. `buffer-overflow`) with real C code + per-step line highlighting, recursive- and diagnostic-aware pedagogy (49 tests), ResizeObserver canvas, animated step transitions, `/about` page, welcome overlay, keyboard shortcuts, shareable URL state, Share button, step dots, fullscreen canvas mode, tablet drawer (T17a), phone gate (T17b). Deployed to https://visualizeit-two.vercel.app. Forward queue in [`docs/roadmap/backlog.md`](roadmap/backlog.md).

## Documentation Index

### Active Work (read first)

- [`docs/roadmap/backlog.md`](roadmap/backlog.md) — P0–P3 task queue + **T-REFACTOR-1→12 queue** (one task = one branch, token-saving subagent rules). Start here before new scenarios.
- [`docs/checkpoints/current-state.md`](checkpoints/current-state.md) — local-only current-state snapshot.
- [`docs/handoffs/2026-05-12-phase-2-recursive-stack-context.md`](handoffs/2026-05-12-phase-2-recursive-stack-context.md) — ongoing session handoff (per-task "What Was Done" notes).

### Architecture

- [`docs/architecture/01-system-architecture.md`](architecture/01-system-architecture.md)
- [`docs/architecture/02-directory-structure.md`](architecture/02-directory-structure.md)
- [`docs/architecture/03-performance-and-simulation-strategy.md`](architecture/03-performance-and-simulation-strategy.md)

### MVP Product Scope

- [`docs/mvp/01-memory-engine-functional-spec.md`](mvp/01-memory-engine-functional-spec.md)
- [`docs/mvp/02-memory-engine-roadmap.md`](mvp/02-memory-engine-roadmap.md)

### Decisions & Future

- [`docs/decisions/adr-001-typescript-simulation-before-wasm.md`](decisions/adr-001-typescript-simulation-before-wasm.md)
- [`docs/roadmap/phase-3-wasm-overview.md`](roadmap/phase-3-wasm-overview.md) — Phase 3 plan (requires explicit approval).
- [`docs/future-modules/01-expansion-backlog.md`](future-modules/01-expansion-backlog.md)

Key source files:

- `features/memory-engine/simulation/fixtures.ts` — scenario definitions.
- `components/memory/MemoryWorkspace.tsx` — main orchestrator.

Note: historical per-session handoffs from Phase 1–2.2 were pruned 2026-09-28; their substance lives in this index, `current-state.md`, and git history.

## Guardrails

- Do not implement future modules during the Memory Engine MVP.
- Do not put model inference inside the render loop or simulation loop.
- Do not use 3D for the memory engine unless there is a clear learning benefit.
- Keep implementation focused on one phase at a time.
- Phase 3 (WASM) requires explicit approval; TS simulation is not a bottleneck today (ADR-001).
