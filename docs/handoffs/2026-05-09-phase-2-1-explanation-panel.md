# Handoff: Phase 2.1 Second Pass — Explanation Panel Redesign (Task #6)

## Objetivo

Alinear `components/memory/ExplanationPanel.tsx` con la referencia
`www.alg0.dev_big-o-notation.png`: tabs `Code` y `Explanation` arriba,
sección `Variables` pinneada como bloque fijo inferior, sin duplicar la
información de `StepBanner`.

## Cambios Realizados

- `components/memory/ExplanationPanel.tsx`
  - Eliminado el `<div className="explanation-panel__step-bar">` con
    `step-badge` y `step-type-chip`. La info de step ya vive en
    `StepBanner` al pie del canvas.
  - Tabs reducidas a `Code` y `Explanation`. Default tab: `code`
    (coincide con la referencia).
  - Tab `Code`: lista `code-steps` con highlight de la línea activa
    (sin cambios de comportamiento).
  - Tab `Explanation`: explanations + Diagnostics + Selected, todos
    dentro del área scrollable.
  - `Variables` movido a `<div className="explanation-panel__variables-pinned">`,
    siempre visible, independiente del tab activo. Renderiza variables
    de `snapshot.stackFrames[].variables` y `snapshot.heapBlocks` con
    los mismos `.variable-chip` ya existentes.
  - Ningún hook nuevo, sin atajos de teclado (Task #6 no los introduce).

- `app/globals.css`
  - Removidos los estilos huérfanos `.explanation-panel__step-bar`,
    `.step-badge__number`, `.step-badge__label`, `.step-type-chip`.
  - Añadida regla `.explanation-panel__variables-pinned`:
    `flex-direction: column`, `gap: 8px`, `padding: 12px 16px`,
    `border-top: 1px solid var(--border-subtle)`, `flex-shrink: 0`,
    `max-height: 40%`, `overflow-y: auto`, scrollbar fina.
  - Pseudo-elemento `::before` con glyph `{x}` sobre el label
    `Variables` para imitar la referencia de alg0.dev.

## Archivos Creados O Modificados

- `components/memory/ExplanationPanel.tsx` (modificado).
- `app/globals.css` (modificado: estilos panel + nueva sección pinneada).
- `docs/checkpoints/current-state.md` (Task #6 marcada ✅ + bloque de
  verificación añadido).
- `docs/handoffs/2026-05-09-phase-2-1-explanation-panel.md` (nuevo,
  este archivo).

## Decisiones Tomadas

- Default tab = `Code` (no `Explanation`). La referencia muestra `Code`
  activo y la lista de pasos del algoritmo es el primer punto de contacto.
- Sin atajos de teclado (`C`, `E`) en esta tarea. La referencia los
  muestra como chips, pero el spec de la sesión pidió no introducirlos.
- `Diagnostics` y `Selected` viven dentro del tab `Explanation` y no
  como secciones pinneadas: solo `Variables` queda fija para coincidir
  con la referencia.
- `step-badge` removido por completo (CSS y JSX). El step está cubierto
  por `MemoryControls` (counter `N / N`) y `StepBanner` (descripción
  del evento). Mantenerlo en el panel duplicaba la información.
- `max-height: 40%` en la sección pinneada para que en escenarios
  largos (p. ej. Leak And Dangling Pointer) el bloque no acapare la
  vertical del panel; el scroll interno absorbe el overflow.

## Verificación

```bash
pnpm test    # 4 archivos · 12 tests · pass
pnpm build   # Next 15.5.15, tsc strict, 5 páginas estáticas, pass
```

Smoke visual en `http://localhost:3001`:

- `tmp-screenshots/screenshot-15-panel-code-tab.png` — estado inicial,
  tab `Code` activo, lista 01–03, Variables pinneado (sin chips porque
  el snapshot inicial no tiene live variables).
- `tmp-screenshots/screenshot-16-panel-explanation-tab.png` — tab
  `Explanation` activo, explanation + Diagnostics + Selected dentro del
  scroll, Variables pinneado abajo.
- `tmp-screenshots/screenshot-17-panel-leak-mid-step.png` — escenario
  `Leak And Dangling Pointer`, step 6/10, tab `Explanation`. Chips
  Variables: `leaked int *`, `dangling int *`, `Leaked int allocated ·
  0x1000`, `Dangling int allocated · 0x1004`. `StepBanner` muestra
  `Step 6: Dangling int` al pie del canvas (sin duplicar en el panel).
- `tmp-screenshots/screenshot-18-panel-leak-code-tab.png` — mismo step,
  tab `Code` activo, línea 05 `Dangling int` highlighted, Variables
  siguen visibles.

Comportamiento verificado:

- Cambio de scenario via `ScenarioSidebar` resetea step a 1 y refresca
  Code highlight, Explanation y Variables consistentemente.
- Mover el progress bar del navbar avanza el step y actualiza los
  chips de Variables y la línea activa de Code.
- Cambio entre tabs no descarta el bloque pinneado.

## Pendientes (Backlog Phase 2.1 second pass)

- Task #7 — `OperationTimeline.tsx`: removerlo o reducirlo a step pills
  compactos ahora que el scrub vive en el navbar.
- Task #8 — `MemoryWorkspace.tsx`: confirmar 3-column layout final
  `[ScenarioSidebar] [canvas + StepBanner] [ExplanationPanel]`.
- Task #9 — `app/globals.css`: revisar grid + spacing global tras
  Task #7/8.
- Task #10 — Migrar fonts a `next/font` (actualmente CDN Google Fonts).
- Task #11 — Screenshot final vs. alg0.dev e iteraciones de polish.
- Task #12 — `pnpm test`, `pnpm lint`, `pnpm build` final pass.

## Próxima Tarea

```text
Lee primero `docs/checkpoints/current-state.md`.

Proyecto: VisualizeIT.
Fase: Phase 2.1 second pass — alg0.dev alignment.
Modo: una tarea por sesión.

Tarea de esta sesión: Tarea #7 del backlog.
Decidir si `components/memory/OperationTimeline.tsx` se elimina o se
reduce a step pills compactos, ahora que el scrub y el step counter
viven en el navbar (`MemoryControls`).

Spec:
- Si se elimina: quitar el componente, limpiar import en
  `MemoryWorkspace.tsx`, borrar estilos `.operation-timeline*` huérfanos
  en `app/globals.css`.
- Si se reduce a pills: dejar solo `operation-timeline__steps` (botones
  01, 02, …) sin la fila superior `TIMELINE … event` ni el `<input
  type="range">` (duplicaría el progress del navbar). Mantener
  highlight `is-active`.

Tomar la decisión justificándola contra la referencia
`www.alg0.dev_big-o-notation.png` (la referencia no muestra timeline
inferior; el progress del navbar es la única fuente de scrub). Default
recomendado: eliminar el componente.

Verificar:
- `pnpm test` (12/12).
- `pnpm build` (tsc strict).
- Smoke visual: dev server en `localhost:3001`, screenshot del workspace
  sin OperationTimeline, comparación contra
  `www.alg0.dev_big-o-notation.png`.

Mantener intactos: engine, fixtures (sólo lectura), pedagogy,
drawMemoryScene, layoutMemoryScene, MemoryCanvas, MemoryControls,
ExplanationPanel, ScenarioSidebar, StepBanner.

Actualizar:
- Marcar Tarea #7 como ✅ con fecha en `docs/checkpoints/current-state.md`.
- Crear `docs/handoffs/YYYY-MM-DD-phase-2-1-operation-timeline.md`.

Al terminar, marca la tarea #7 como completada en current-state.md, deja las restantes como ⏳.
```
