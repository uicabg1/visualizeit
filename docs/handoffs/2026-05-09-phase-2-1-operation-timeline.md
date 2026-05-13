# Handoff: Phase 2.1 Second Pass — Operation Timeline Removal (Task #7)

## Objetivo

Decidir el destino de `components/memory/OperationTimeline.tsx` ahora
que el scrub y el step counter viven en el navbar (`MemoryControls`,
Task #4) y la descripción del evento vive en `StepBanner` (Task #5).
La referencia `www.alg0.dev_big-o-notation.png` no muestra timeline
inferior, así que el progress bar del navbar es la única fuente de
scrub.

## Cambios Realizados

- `components/memory/OperationTimeline.tsx`
  - **Eliminado por completo.** No queda ningún archivo en
    `components/memory/` con ese nombre.

- `components/memory/MemoryWorkspace.tsx`
  - Removido `import { OperationTimeline } from "./OperationTimeline";`.
  - Removido el render `<OperationTimeline … />` dentro de
    `<div className="memory-workspace__canvas-area">`. El canvas-area
    queda con dos hijos: `<MemoryCanvas />` y `<StepBanner />`.
  - Sin cambios en hooks, props, simulación ni handlers.

- `app/globals.css`
  - Removido el bloque entero `/* ─── Operation timeline ─── */` con
    sus reglas: `.operation-timeline`, `.operation-timeline__header`,
    `.operation-timeline h2`, `.operation-timeline__event`,
    `.operation-timeline input[type="range"]`,
    `.operation-timeline__steps`, `.operation-timeline__steps button`,
    `.operation-timeline__steps button.is-active`. ~70 líneas
    huérfanas eliminadas. La regla siguiente
    (`/* ─── Explanation panel ─── */`) queda directamente debajo de
    `.memory-controls__speed select`.

## Archivos Creados O Modificados

- `components/memory/OperationTimeline.tsx` (eliminado).
- `components/memory/MemoryWorkspace.tsx` (modificado).
- `app/globals.css` (modificado).
- `docs/checkpoints/current-state.md` (Task #7 marcada ✅, bloque de
  verificación añadido, ruta `OperationTimeline.tsx` removida de
  Stable Files, Next Steps actualizado para Task #8).
- `docs/handoffs/2026-05-09-phase-2-1-operation-timeline.md` (nuevo,
  este archivo).

## Decisiones Tomadas

- **Default = eliminar el componente**, no reducir a step pills.
  Justificación contra la referencia y contra el resto de la UI:
  - La referencia `www.alg0.dev_big-o-notation.png` no muestra ningún
    timeline horizontal debajo del canvas. La única fuente de scrub
    es la progress bar del navbar (Task #4).
  - El navbar ya cubre: Reset, ◄, ▶, ►, progress, `N / N`, SPEED.
    No hay información que el componente aportara sin duplicar.
  - `StepBanner` ya cubre la descripción del evento (`Step N: …`)
    con el énfasis pedagógico amber del spec.
  - Las step pills `01 02 03 …` son útiles cuando el set de pasos es
    pequeño, pero dejan de escalar con escenarios largos
    (`Leak And Dangling Pointer` tiene 10 pasos; `Heap Allocation`
    crecerá con más fixtures). Mantenerlos invitaría a tap-targets
    chicos y scroll horizontal en una zona ya cubierta por el slider
    del navbar.
- Sin atajos de teclado nuevos en esta tarea (consistente con el spec
  y con la decisión equivalente de Task #6).
- No tocar `app/globals.css` más allá de eliminar el bloque
  `.operation-timeline*`. Si Task #8 decide rebalancear el grid o el
  spacing del canvas-area, ese cambio queda fuera de scope aquí.
- No tocar `MemoryCanvas`, `StepBanner`, `ExplanationPanel`,
  `ScenarioSidebar`, `MemoryControls`, ni la simulación. Engine,
  snapshots, pedagogy, drawMemoryScene y layoutMemoryScene siguen
  intactos.

## Verificación

```bash
pnpm test    # 4 archivos · 12 tests · pass
pnpm build   # Next 15.5.15, tsc strict, 5 páginas estáticas, pass
```

Smoke visual en `http://localhost:3001`:

- `tmp-screenshots/screenshot-19-task7-default.png` — estado inicial
  `Stack Frame Basics`. Navbar `1 / 4`, sidebar 220px con grupos
  Fundamentals (2) / Data Structures (1) / Bugs & Pitfalls (1),
  canvas STACK/HEAP vacíos, panel derecho con tab `Code` activo y
  Variables pinneado abajo (`No live variables yet.`), `StepBanner`
  `Initial memory state` al pie del canvas. Sin franja de timeline
  debajo del banner.
- `tmp-screenshots/screenshot-20-task7-leak-mid.png` — click en
  sidebar → `Leak And Dangling Pointer`, scrub navbar a value=5 →
  step `6 / 10`. Canvas: stack `main()` con `leaked int *` y
  `dangling int *` (`(valid)` ambos), heap con `Leaked int 0x1000`
  y `Dangling int 0x1004` allocated, edges azules con offsets.
  Panel derecho: tab `Code`, línea 05 `Dangling int` highlighted;
  Variables chips `leaked int *`, `dangling int *`,
  `Leaked int allocated · 0x1000`, `Dangling int allocated · 0x1004`.
  `StepBanner`: `Step 6: Dangling int`. Sin timeline al pie.

Comportamiento verificado:

- Cambio de scenario via `ScenarioSidebar` resetea el step counter
  del navbar a `1 / N` y refresca canvas + Code + Variables.
- Mover el progress bar del navbar avanza el step y el `StepBanner`
  refleja el evento.
- No quedan referencias huérfanas: `grep -rn "OperationTimeline\|operation-timeline"`
  sólo aparece en docs históricas (handoffs previos, plan de Phase 2,
  directory-structure) y en el propio `current-state.md` (verificación
  Task #4 menciona el componente como intacto en su momento).

## Pendientes (Backlog Phase 2.1 second pass)

- Task #8 — `MemoryWorkspace.tsx`: validar y consolidar el 3-column
  layout `[ScenarioSidebar] [canvas + StepBanner] [ExplanationPanel]`,
  ahora que canvas-area sólo tiene 2 hijos.
- Task #9 — `app/globals.css`: revisar grid + spacing + sidebar styles
  + navbar center cluster, eliminar reglas que asumían el 3-row
  canvas-area.
- Task #10 — Migrar fonts a `next/font` (actualmente CDN Google Fonts).
- Task #11 — Screenshot final vs. alg0.dev e iteraciones de polish.
- Task #12 — `pnpm test`, `pnpm lint`, `pnpm build` final pass.

## Próxima Tarea

Ver bloque actualizado al final de `docs/checkpoints/current-state.md`
sección `Next Steps` (Tarea #8 — consolidar layout
3-column de `MemoryWorkspace.tsx`).
