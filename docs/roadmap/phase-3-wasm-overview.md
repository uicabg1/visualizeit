# Phase 3 Overview — WASM Acceleration & Portfolio Hardening

**Date:** 2026-05-12
**Status:** Planning — multi-session phase. Each sub-task gets its own plan doc when ready.
**Predecessors:** `explain-event-polish` + 1-2 new scenarios + deploy. Do not start before those land.

## Goal

Promote VisualizeIT from "visual demo" to "engineering case study." Add a deterministic WASM simulation path that mirrors the TypeScript engine, prove parity, and document the boundary decisions.

## Why Phase 3 Exists

- Engineering interviews want depth, not breadth. WASM + worker boundary + parity tests are the credibility multiplier.
- Most viewers will not notice WASM. The case study doc + parity test results are what land in front of recruiters.
- Trade-off: high effort, invisible UX. Belongs after visible-impact work (explanations, scenarios, deploy).

## Sub-Tasks (each = one session, separate plan doc when activated)

### 3.1 — C Memory Model Prototype
- Write minimal C source mirroring current domain: stack frames, heap blocks, malloc, free, pointer fields.
- Target: subset that supports `stack-frame-basics` + `heap-allocation` only.
- Output: standalone `.c` file + Makefile. No WASM yet.

### 3.2 — WASM Compile Pipeline
- Pick toolchain: `emscripten` (mature, easy JS interop) vs `wasi-sdk` (cleaner output). Default: emscripten.
- Build script: `pnpm wasm:build` → produces `.wasm` + JS glue in `public/wasm/` or `features/memory-engine/wasm/`.
- ADR: document choice in `docs/decisions/adr-002-wasm-toolchain.md`.

### 3.3 — TypeScript WASM Adapter
- New module: `features/memory-engine/wasm/wasmEngine.ts`.
- Same signature as TS engine: `runScenario(commands): MemorySnapshot[]`.
- Internally: marshal commands → call WASM exports → marshal snapshots back.
- No UI consumes it yet — only tests.

### 3.4 — Parity Test
- New test file: `features/memory-engine/wasm/parity.test.ts`.
- Runs each fixture through both engines; deep-equals snapshots.
- Block release until passing for chosen subset of scenarios.

### 3.5 — Web Worker Boundary (optional, gated on perf measurement)
- Measure: does TS engine cause main-thread jank under recursive-stack or 100-step fixture? If no → skip worker.
- If yes: move WASM call into a worker; UI subscribes via `postMessage`.

### 3.6 — Perf Metrics Panel
- Dev-only overlay (env-gated): shows TS engine time, WASM engine time per scenario.
- Behind `NEXT_PUBLIC_PERF=1` env flag. Off in production by default.

### 3.7 — Case Study Doc
- `docs/architecture/04-case-study.md`: 1-page narrative aimed at recruiters.
- Sections: problem statement, architecture diagram, WASM boundary rationale, parity strategy, perf numbers.
- Linked from README and portfolio.

### 3.8 — Deployment Hardening
- Custom domain (if available).
- Vercel Speed Insights + Analytics on.
- Update Live Demo section with metrics screenshot.

## Success Criteria (per roadmap doc)

- WASM simulation matches TS simulation snapshot-for-snapshot for selected scenarios.
- Main thread responsive during simulation.
- Project is readable as engineering case study, not visual demo.

## Boundaries For The Whole Phase

- WASM is a parallel path, not a replacement. TS engine remains canonical until parity is locked.
- No domain redesign. WASM models the same commands and snapshots that already exist.
- No regression in current scenarios — they keep running on TS until UI consumes WASM.

## Risk

WASM boundary work has the highest risk of scope creep in the project so far. Sub-tasks 3.1, 3.2, 3.3 must each ship in single sessions. If any sub-task blows past a session, downgrade to scope of "stack-frame-basics only" and document in handoff.
