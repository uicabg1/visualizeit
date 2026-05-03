# Performance And Simulation Strategy

## Performance Goals

The MVP should feel immediate and technically credible.

Target budgets:

- Main interactions should stay near 60 FPS.
- Canvas redraw should stay under 8 ms for normal scenes.
- Simulation steps should avoid blocking the main thread.
- Timeline scrubbing should feel instant for typical examples.
- Large examples should degrade gracefully with simplified rendering.

## Simulation Model

The memory engine should model operations as commands and outputs as snapshots.

Example command types:

- `DECLARE_VARIABLE`
- `ENTER_FUNCTION`
- `EXIT_FUNCTION`
- `MALLOC`
- `FREE`
- `ASSIGN_POINTER`
- `WRITE_FIELD`
- `WRITE_ARRAY_INDEX`
- `READ_VALUE`

Example snapshot contents:

- Stack frames.
- Local variables.
- Heap blocks.
- Pointer relationships.
- Allocation status.
- Diagnostics.
- Human-readable event labels.

## Deterministic Replay

Every simulation should be replayable from the initial state using the same command list. Snapshots may be cached for fast scrubbing, but the command log remains the source of truth.

Benefits:

- Easier testing.
- Easier debugging.
- Easier export of examples.
- Easier future AI explanation because every event has stable context.

## WASM Boundary

The WASM module should be treated as a deterministic simulation accelerator, not as a UI engine.

Recommended boundary:

- TypeScript validates high-level commands.
- WASM applies low-level memory model operations.
- WASM returns compact snapshot data.
- TypeScript maps raw snapshot data into renderable view models.

Avoid:

- Direct React state inside WASM.
- Canvas drawing from WASM in the MVP.
- Large object graphs crossing the WASM boundary every frame.
- Unversioned binary payloads.

## Web Worker Strategy

Use a Web Worker when simulation cost becomes large enough to affect interaction. The worker owns calls into WASM and returns snapshots to the main thread.

Message protocol:

- `INIT`
- `APPLY_COMMAND`
- `RUN_SEQUENCE`
- `GET_SNAPSHOT`
- `RESET`
- `MEASURE`

The main thread owns rendering and UI state. The worker owns simulation execution.

## Rendering Strategy

Use Canvas 2D for the Memory Engine MVP.

Canvas should render:

- Stack frame blocks.
- Heap block blocks.
- Pointer arrows.
- Struct field slots.
- Allocation/free highlights.
- Diagnostic overlays.

Framer Motion should be used for UI transitions, panel movement, tab changes, and explanation reveals. It should not animate thousands of memory primitives.

## Progressive Complexity

Phase 1 can start with a TypeScript-only simulation core to validate domain behavior. Phase 2 introduces WASM for the allocator model and snapshot generation. This reduces risk and prevents the project from getting blocked on tooling too early.

## Testing Strategy

Test layers independently:

- Domain command validation.
- Simulation state transitions.
- Snapshot serialization.
- Pedagogy explanations.
- Canvas layout calculations.
- Worker message protocol.
- End-to-end memory walkthrough.

The renderer should be tested through layout unit tests and browser smoke tests rather than brittle pixel-perfect tests for every frame.

