# VisualizeIT

**[Live Demo →](https://visualizeit-two.vercel.app)**

VisualizeIT is a high-performance interactive web platform for explaining dense technical concepts through real-time deterministic simulation. The MVP is a low-level C memory visualizer: stack frames, heap allocation, pointers, structs, recursion, fragmentation, leaks, dangling pointers, and buffer overflows — stepped through with timeline replay and per-line C code highlighting.

It is built as a portfolio-grade engineering case study: clear simulation boundaries, deterministic state, measurable targets, and a modular architecture ready for future educational engines.

## Current Status

| Phase | Status |
|-------|--------|
| 1 — Deterministic Simulation Foundation | ✅ Done (2026-05-03) |
| 2 — Interactive Canvas Visualizer | ✅ Done (2026-05-04) |
| 2.1 — alg0.dev Visual Alignment | ✅ Done (2026-05-10) |
| 2.2 — Brand Identity & Visual Refinement | ✅ Done (2026-05-11) |
| 2.5 — Content Expansion + Production Launch | 🔵 Active (T1–T17b done) |
| 3 — WASM Acceleration | ⏳ Not started |

**Today:** 8 scenarios · 49 passing tests · deployed to Vercel production.

### Features live

- Step-through memory simulation: play/pause, speed control, scrub, clickable step dots, deterministic replay.
- Real C source per scenario with per-step line highlighting; recursive- and diagnostic-aware explanations.
- Canvas visualizer with tweened step transitions, click-to-inspect elements, fullscreen focus mode (`f`).
- Shareable URL state (`?scenario=<id>&step=<n>`) + Share button + static `/about` page.
- Keyboard shortcuts (Space, arrows), categorized scenario sidebar with search, welcome title card.
- Responsive: 3-column desktop → tablet drawer (768–1023px) → intentional phone gate (<768px).

## Architecture

Strict TypeScript, framework-independent simulation core:

```
features/memory-engine/
  domain/        — commands, snapshots, diagnostics, types (contracts)
  simulation/    — memoryEngine.ts (reducer), fixtures.ts (scenarios)
  pedagogy/      — explainEvent.ts (snapshot → explanation lines)
  rendering/     — layout, Canvas2D draw, interpolation, playback speed
components/memory/  — MemoryWorkspace (orchestrator), Canvas, Sidebar,
                      ExplanationPanel, Controls, StepBanner, PhoneGate
app/                — App Router pages (/, /about), tokens in globals.css
```

- The engine is a pure reducer: same commands in → same snapshots out. UI never mutates simulation state.
- Per ADR-001, the simulation stays in TypeScript until profiling justifies WebAssembly (Phase 3, planned: C model → WASM + Web Worker with parity tests).

## Tech Stack

- **Next.js 15** (App Router, strict TypeScript, `next/font` self-hosted fonts).
- **Canvas 2D** rendering with `requestAnimationFrame` transitions.
- **Vitest** for the simulation, pedagogy, layout, and interpolation suites.
- **Vercel** for production deploys.

## Local Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest run — 49 tests
pnpm lint
pnpm build
```

## Documentation Map

Start here:

- [`docs/00-context-index.md`](docs/00-context-index.md) — index, phase status, guardrails.
- [`docs/roadmap/backlog.md`](docs/roadmap/backlog.md) — active task queue (Phase 2.5 → 3).
- [`docs/mvp/01-memory-engine-functional-spec.md`](docs/mvp/01-memory-engine-functional-spec.md) — MVP feature spec.
- [`docs/mvp/02-memory-engine-roadmap.md`](docs/mvp/02-memory-engine-roadmap.md) — three-phase roadmap.
- [`docs/architecture/`](docs/architecture) — system architecture, directory structure, performance strategy.
- [`docs/decisions/adr-001-typescript-simulation-before-wasm.md`](docs/decisions/adr-001-typescript-simulation-before-wasm.md) — key technical decision.
- [`docs/roadmap/phase-3-wasm-overview.md`](docs/roadmap/phase-3-wasm-overview.md) — Phase 3 planning.
- [`docs/future-modules/01-expansion-backlog.md`](docs/future-modules/01-expansion-backlog.md) — IPv6/SLAAC, discrete math, XAI (not MVP scope).
