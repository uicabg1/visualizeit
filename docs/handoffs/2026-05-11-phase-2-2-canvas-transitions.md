# Handoff: Phase 2.2 — Canvas Step Transitions

## Objetivo

Reemplazar el corte brusco entre snapshots con transiciones suaves y deterministas en el canvas. Cada paso se anima en lugar de teleportarse.

## Cambios Realizados

### Tier 1 implementado: posición lerp + fade por elemento

Se implementó el **Tier 1 completo** del plan (no fue necesario degradar a Tier 2).

- **Entering elements** (nuevo en `next`): opacity 0 → 1 durante la transición.
- **Exiting elements** (sólo en `prev`): opacity 1 → 0 durante la transición.
- **Persisting elements** (mismo ID en prev/next): posición y tamaño interpolados con `lerpRect`.
- **Variables dentro de frames persistentes**: interpolación individual por `variableId`.
- **Fields dentro de bloques persistentes**: interpolación individual por `id`.
- **Pointer edges**: interpolación de `from`/`to` por ID de edge.
- Easing: `easeInOutCubic` — valor 0.5 en t=0.5, simétrica, natural para UI.
- Duración: `getTransitionMs(speed, intervalMs)` — formula `min(200/speed, intervalMs*0.6)` garantiza que la transición siempre es < intervalo de auto-play.
- Scrub guard: si `stepDelta > 1` (scrub rápido por progress bar), snap inmediato.
- `prefers-reduced-motion: reduce` → snap inmediato, sin animación.

## Archivos Creados o Modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `features/memory-engine/rendering/canvasTypes.ts` | modificado | `opacity?: number` en todos los nodos: `StackFrameNode`, `StackVariableNode`, `HeapBlockNode`, `HeapFieldNode`, `PointerEdgeNode`, `DiagnosticBadgeNode` |
| `features/memory-engine/rendering/drawMemoryScene.ts` | modificado | `context.globalAlpha` aplicado en `drawStackFrame`, `drawHeapBlock`, `drawPointerEdge`, `drawDiagnosticBadge`; `context.globalAlpha *=` en `drawRow` (multiplicativo para combinar con opacity del frame padre) |
| `features/memory-engine/rendering/interpolateScene.ts` | nuevo | `easeInOutCubic`, `tweenRenderModel`. Funciones puras, sin estado. |
| `features/memory-engine/rendering/interpolateScene.test.ts` | nuevo | 10 tests: easing bounds/monotonía, tween position lerp, entering/exiting opacity, bounds |
| `features/memory-engine/rendering/playbackSpeed.ts` | modificado | `getTransitionMs(speed, intervalMs)` |
| `features/memory-engine/rendering/playbackSpeed.test.ts` | modificado | 4 tests nuevos para `getTransitionMs` |
| `components/memory/MemoryCanvas.tsx` | modificado | rAF animation loop con `prevSceneRef`, `prevStepRef`, `rafRef`; guard `prefersReducedMotion`, `stepDelta > 1`; nuevas props `stepIndex?`, `playbackSpeed?` |
| `components/memory/MemoryWorkspace.tsx` | modificado | pasa `stepIndex={activeStepIndex}` y `playbackSpeed={playbackSpeed}` a `MemoryCanvas` |

## Decisiones Tomadas

- **opacity multiplicativo vs override en `drawRow`**: se usa `context.globalAlpha *=` (multiplicativo) para que la opacidad del frame padre (entering frame) se combine correctamente con la opacidad de variables individuales (entering variable dentro de frame persistente). Si fuera override, una variable entering dentro de un frame entering tendría 0.5 en lugar de 0.5*0.5=0.25.
- **`drawPointerEdge` nuevo `context.save()`**: la función original no tenía save/restore propio (sólo tenía uno interno). Se añadió un save/restore exterior para aislar el `globalAlpha` de opacity. Se documentaron ambos restores con comentarios.
- **Tier 1 completo (no degradar)**: la implementación con lerp de posición es manejable dado que el layout usa IDs estables (`frameId`, `blockId`, `variableId`). No hubo jitter.
- **stepDelta > 1 requiere `stepIndex` prop**: se añadió como prop opcional. `MemoryWorkspace` lo pasa. Alternativa (heurística in-flight) descartada por ser menos determinista.
- **Scenario Stack Focus (Task B) diferido**: no se pudo ejecutar en esta sesión porque toca `layoutMemoryScene.ts` (invariante de sesión). Sigue pendiente.

## Verificación

```
pnpm test     → 27/27 (5 test files; 10 nuevos tests en interpolateScene + 4 en playbackSpeed)
pnpm exec eslint app components features → 0 errores
pnpm build    → ✓ success; route / = 10.4 kB (+0.8 kB vs baseline ~9.6 kB; dentro del límite +2 kB del plan)
```

Invariantes preservados:
- Simulación, engine, fixtures, pedagogy, `layoutMemoryScene.ts` — sin cambios.
- `app/layout.tsx` (next/font) — sin cambios.
- 3-column layout, navbar 3-slot, `StepBanner`, `ExplanationPanel` — sin cambios.
- Tokens Phase 2.1 + Phase 2.2 brand identity — sin cambios.
- `PALETTE` const en `drawMemoryScene.ts` — sin cambios.

## Pendientes

- Task B: Scenario Stack Focus — diferido por invariante `layoutMemoryScene.ts`. Requiere decisión explícita sobre si ese invariante aplica a Task B dado que el plan lo contempla.
- Playwright video/mid-tween screenshots — no capturados (animación en canvas, difícil de capturar en still). Manual smoke recomendado: abrir `http://localhost:3000`, avanzar pasos, verificar que los frames se deslizan en lugar de teleportarse.

## Próxima Tarea

Ver sección en `docs/checkpoints/current-state.md`.
