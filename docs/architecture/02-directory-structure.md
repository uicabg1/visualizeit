# Planned File Directory Structure

This structure is for the future implementation phase. The current project contains documentation only.

## Target Structure

```text
visualizeit/
  README.md
  docs/
    00-context-index.md
    architecture/
      01-system-architecture.md
      02-directory-structure.md
      03-performance-and-simulation-strategy.md
    mvp/
      01-memory-engine-functional-spec.md
      02-memory-engine-roadmap.md
    future-modules/
      01-expansion-backlog.md


  app/
    layout.tsx
    page.tsx
    memory/
      page.tsx
      loading.tsx

  components/
    shell/
      AppShell.tsx
      ModuleNav.tsx
      StatusBar.tsx
    memory/
      MemoryWorkspace.tsx
      MemoryCanvas.tsx
      StackPanel.tsx
      HeapPanel.tsx
      PointerInspector.tsx
      OperationTimeline.tsx
      ExplanationPanel.tsx
      MemoryControls.tsx
    ui/
      Button.tsx
      Tabs.tsx
      Slider.tsx
      Tooltip.tsx

  features/
    memory-engine/
      domain/
        types.ts
        commands.ts
        snapshots.ts
        diagnostics.ts
      simulation/
        memoryEngine.ts
        memoryEngine.test.ts
        fixtures.ts
      pedagogy/
        explainEvent.ts
        explainEvent.test.ts
      rendering/
        layoutMemoryScene.ts
        drawMemoryScene.ts
        canvasTypes.ts
      hooks/
        useMemoryEngine.ts
        useMemoryTimeline.ts
        useCanvasViewport.ts

  hooks/
    useAnimationFrame.ts
    useResizeObserver.ts
    useStableCallback.ts

  lib/
    wasm/
      loadMemoryWasm.ts
      wasmTypes.ts
    workers/
      memoryWorkerClient.ts
      protocol.ts
    performance/
      frameBudget.ts
      metrics.ts

  workers/
    memory.worker.ts

  wasm/
    memory-engine/
      README.md
      include/
        memory_engine.h
      src/
        memory_engine.c
        allocator_model.c
        snapshot.c
      tests/
        memory_engine_tests.c
      build/
        .gitkeep

  public/
    assets/
      diagrams/
      textures/

  tests/
    e2e/
      memory-engine.spec.ts
    visual/
      memory-engine-smoke.spec.ts
```

## Boundary Rules

- `components/` should contain presentational React components.
- `features/memory-engine/domain/` should contain serializable types and pure domain contracts.
- `features/memory-engine/simulation/` should contain TypeScript simulation orchestration and tests.
- `features/memory-engine/rendering/` should contain Canvas layout and drawing functions.
- `features/memory-engine/pedagogy/` should contain deterministic explanations.
- `lib/wasm/` should contain WASM loading and boundary adapters.
- `wasm/memory-engine/` should contain C/C++ source code only.
- `workers/` should contain worker entrypoints, not domain logic.

## Naming Policy

Prefer explicit names over clever abbreviations. The goal is to make file responsibilities self-evident from the name alone.

Good:

- `drawMemoryScene.ts`
- `explainEvent.ts`
- `memoryWorkerClient.ts`

Avoid:

- `utils.ts`
- `helpers.ts`
- `engine2.ts`

