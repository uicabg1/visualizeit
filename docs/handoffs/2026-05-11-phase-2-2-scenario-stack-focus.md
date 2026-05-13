# Handoff: Phase 2.2 — Scenario Stack Focus

**Date:** 2026-05-11
**Status:** Shipped — Path A implemented (engine-level releasedFrames)

## What changed

### Region hiding
- `MemoryScenario` gains optional `regions?: { stack?: boolean; heap?: boolean }`.
- `stack-frame-basics` → `regions: { stack: true, heap: false }`.
- `heap-allocation` → `regions: { stack: true, heap: true }` (both lanes; pointer arrow stack→heap is the key visual for this scenario).
- `layoutMemoryScene` honors regions: hidden lane is omitted; visible lane expands to `minWidth - 2*stackX = 864px` content width.
- `MemoryScene` gains optional `stackLane?: MemorySceneLane` and `heapLane?: MemorySceneLane` (optional to keep `interpolateScene.ts` untouched).
- `drawMemoryScene` draws lanes from `scene.stackLane`/`scene.heapLane` when present; falls back to hardcoded defaults for tweened intermediate scenes.

### Ghost frame (Path A — engine-level)
- `ReleasedStackFrame = { functionName: string; variables: StackVariable[] }` added to `snapshots.ts`.
- `MemorySnapshot` gains `releasedFrames: ReleasedStackFrame[]`.
- `memoryEngine.ts`: `applyCommand` resets `state.lastReleasedFrame = null` at the start of each command; `EXIT_FUNCTION` captures the popped frame before removing it. `createSnapshot` serialises it.
- `layoutMemoryScene` lays out released frames below live stack frames at 30% opacity with `released: true`.
- `MemoryScene` gains optional `releasedFrames?: StackFrameNode[]`.
- `drawMemoryScene` renders them via new `drawReleasedStackFrame` helper: dashed amber border, 30% opacity, "released" subtitle in muted text.

### Animation fix (MemoryCanvas.tsx)
- At `t=1` the tween now paints `scene` directly (not `tweenRenderModel(prev, scene, 1)`) so optional fields (`stackLane`, `heapLane`, `releasedFrames`) are preserved in the final frame.
- During `t < 1`, tweened model is spread with `scene.stackLane`/`scene.heapLane`/`scene.releasedFrames` so the correct single/dual lane renders throughout the tween, not just at `t=1`.

### Label + copy updates
- `Stack Frame Basics` → `Stack Frames`
- `Heap Allocation` → `Heap Blocks`
- Step 4 command label: `Exit main — locals released, frame ghosted for reference.`

## Files touched
- `features/memory-engine/domain/snapshots.ts`
- `features/memory-engine/domain/types.ts` — unchanged (StackVariable reused via snapshots import)
- `features/memory-engine/simulation/fixtures.ts`
- `features/memory-engine/simulation/memoryEngine.ts`
- `features/memory-engine/simulation/memoryEngine.test.ts` (+1 test)
- `features/memory-engine/rendering/canvasTypes.ts`
- `features/memory-engine/rendering/layoutMemoryScene.ts`
- `features/memory-engine/rendering/layoutMemoryScene.test.ts` (+1 test)
- `features/memory-engine/rendering/drawMemoryScene.ts`
- `components/memory/MemoryCanvas.tsx` (tween final-frame fix)
- `components/memory/MemoryWorkspace.tsx` (pass scenario.regions)

## Invariants preserved
- `interpolateScene.ts` — not touched. Optional fields forwarded from target scene in `MemoryCanvas.tsx` during tween.
- Snapshots deterministic: 29/29 tests pass.
- ESLint: 0 errors.
- Build: route `/` = 10.8 kB (+0.4 kB from baseline 10.4 kB, < +1 kB target).

## Known behaviour
- `stack-frame-basics` shows only stack lane (heap hidden). Steps 1-3 animate stack content; step 4 shows ghost frame.
- `heap-allocation` shows both lanes. Steps 1-2 show stack setup (`p = NULL`); step 3 shows malloc with pointer arrow stack→heap; step 5 shows freed block.

## Regression check
- `struct-with-pointer` and `leak-and-dangling-pointer`: both lanes visible, pointer arrows correct.
