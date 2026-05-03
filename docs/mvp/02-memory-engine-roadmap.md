# Memory Engine MVP Roadmap

## Phase 1: Deterministic Simulation Foundation

Goal: prove the memory model before building sophisticated visuals.

Deliverables:

- Strict TypeScript project scaffold.
- Memory domain types.
- Command model.
- Snapshot model.
- Four hardcoded MVP scenarios.
- Unit tests for stack, heap, pointers, structs, and diagnostics.
- Basic text-based debug view for snapshots.

Success criteria:

- The same command sequence always produces the same snapshots.
- Leaks, dangling pointers, and double free can be detected.
- The implementation does not depend on Canvas, React, or WASM yet.

## Phase 2: Interactive Canvas Visualizer

Goal: turn simulation snapshots into a polished interactive learning experience.

Deliverables:

- Memory workspace route.
- Canvas rendering for stack, heap, pointers, and structs.
- Operation timeline.
- Inspector panel.
- Explanation panel.
- Scenario selector.
- Play, pause, step, rewind, reset controls.
- Browser smoke test for the complete walkthrough.

Success criteria:

- A user can understand one full scenario without reading source code.
- Timeline scrubbing does not break visual state.
- UI state remains separate from simulation state.

## Phase 3: WASM Acceleration And Portfolio Hardening

Goal: demonstrate low-level performance engineering and prepare the demo for corporate portfolio use.

Deliverables:

- C/C++ memory model prototype compiled to WASM.
- TypeScript WASM adapter.
- Optional Web Worker execution path.
- Performance metrics panel or development overlay.
- Documentation of WASM boundary decisions.
- Deployment-ready README.
- Case study summary for portfolio pages.

Success criteria:

- WASM simulation path matches TypeScript simulation behavior for selected scenarios.
- Main thread remains responsive during simulation.
- The project can be explained as an engineering case study, not only a visual demo.

## Recommended Build Order

1. Define domain types and command contracts.
2. Implement TypeScript simulation first.
3. Add scenario fixtures.
4. Add deterministic snapshot tests.
5. Build Canvas layout functions.
6. Build React workspace and controls.
7. Add WASM only after simulation behavior is stable.
8. Add worker boundary if performance measurements justify it.

