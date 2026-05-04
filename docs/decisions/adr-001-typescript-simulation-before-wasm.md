# ADR-001: TypeScript Simulation Before WASM

## Status

Accepted

## Context

Phase 1 needs to prove the memory model before introducing Canvas rendering, WebAssembly, or Web Workers. The project documentation already frames WASM as an acceleration boundary, not the source of UI behavior.

## Decision

The deterministic memory simulation is implemented first in strict TypeScript. WASM will be introduced later only after the TypeScript behavior is stable and covered by tests.

## Consequences

- Simulation behavior can be tested quickly with Vitest.
- Future WASM output can be compared against the TypeScript reference implementation.
- Phase 1 remains independent from Canvas, React state, Web Workers, and future modules.
- Some low-level behavior is modeled rather than truly executed as C memory, which is acceptable for the Phase 1 foundation.

