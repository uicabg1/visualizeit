# VisualizeIT

VisualizeIT is a high-performance interactive web platform for explaining dense technical concepts through real-time visual simulation. The first MVP focuses on a low-level C memory visualizer that demonstrates stack frames, heap allocation, pointers, structs, fragmentation, leaks, and deterministic replay of memory operations.

The project is designed as a portfolio-grade engineering case study: not just a beautiful interface, but a client-side system with clear simulation boundaries, measurable performance targets, and a modular architecture ready for future educational engines.

## MVP Focus

The initial deliverable is the **Low-Level Memory Engine**:

- Visualizes C memory behavior step by step.
- Shows stack vs heap allocation.
- Explains `malloc`, `free`, dangling pointers, leaks, and fragmentation.
- Represents structs, arrays, pointers, and nested data layouts.
- Supports timeline replay, pause, rewind, and annotated execution.

Future modules for IPv6/SLAAC, discrete mathematics, and explainable AI are documented as expansion tracks, not as MVP scope.

## Why Next.js

Next.js 15 with the App Router provides a production-ready foundation for a technical visualization platform:

- Strong routing and layout primitives for modular learning experiences.
- TypeScript-first architecture for reliable domain boundaries.
- Static generation and edge-ready deployment paths for portfolio distribution.
- A clean path to future API routes, AI-assisted explanations, and server-side content workflows.

## Why WebAssembly

WebAssembly is used where deterministic simulation and compact data processing matter. For the memory engine, the goal is to model C-like behavior with predictable execution, explicit memory ownership semantics, and efficient transfer of simulation snapshots to the UI layer.

The rendering layer remains in TypeScript, Canvas, and React. WASM does not drive the UI directly; it produces structured simulation state that the frontend can render, inspect, and replay.

## Technical Direction

Planned stack:

- **Framework:** Next.js 15, App Router, strict TypeScript.
- **2D Rendering:** Canvas API for memory maps, timelines, and technical board-style visuals.
- **Animation:** Framer Motion for interface transitions and guided explanations.
- **3D Rendering:** React Three Fiber / Three.js for future network and AI embedding modules.
- **Simulation Core:** C/C++ compiled to WebAssembly for deterministic workloads.
- **Concurrency:** Web Workers for simulation workloads that should not block the main thread.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Run the verification suite:

```bash
pnpm test
pnpm lint
pnpm build
```

Run the production build locally:

```bash
pnpm build
pnpm start
```

## Current Implementation State

Phase 1 is implemented:

- Strict TypeScript project scaffold.
- Deterministic TypeScript memory simulation.
- Domain contracts for commands, snapshots, diagnostics, stack frames, heap blocks, pointers, and values.
- Four MVP scenario fixtures.
- Unit tests for simulation behavior and deterministic explanations.
- Root debug view that renders scenario summaries from real snapshots.

Not implemented yet:

- Canvas visualizer.
- WASM acceleration.
- Web Worker execution.
- Future modules.

## Documentation Map

Start here:

- `docs/00-context-index.md`: token-efficient reading guide for ChatGPT sessions.
- `docs/architecture/01-system-architecture.md`: system architecture document with Mermaid diagram.
- `docs/architecture/02-directory-structure.md`: planned Next.js project structure.
- `docs/architecture/03-performance-and-simulation-strategy.md`: performance, WASM, workers, and replay strategy.
- `docs/mvp/01-memory-engine-functional-spec.md`: MVP feature specification.
- `docs/mvp/02-memory-engine-roadmap.md`: three-phase MVP roadmap.
- `docs/future-modules/01-expansion-backlog.md`: future module documentation.
