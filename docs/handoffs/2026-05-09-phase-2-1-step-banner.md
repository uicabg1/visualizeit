# Handoff: Phase 2.1 — Step Banner (Task #5)

## Objetivo

Agregar `components/memory/StepBanner.tsx` — banner pedagógico al pie del canvas con prefijo `Step N:` ámbar + descripción del evento activo, alineado con la referencia `www.alg0.dev_big-o-notation.png`.

## Cambios Realizados

- Nuevo componente client `components/memory/StepBanner.tsx` con props `stepIndex`, `stepCount`, `event: MemoryEvent | null`. Sin estado interno.
- Render condicional: si `event === null` o `event.commandType === "INITIALIZE"`, muestra placeholder "Initial memory state" en `--text-secondary` cursiva. En otro caso, `Step N:` (1-indexed, `--color-warning`, font-mono, weight 600) + `event.label` (`--text-primary`, font-body).
- Wired dentro de `.memory-workspace__canvas-area` en `MemoryWorkspace.tsx`, justo entre `<MemoryCanvas />` y `<OperationTimeline />`. Pasa `activeSnapshot.event`, `snapshots.length` y `activeStepIndex`.
- Estilos `.memory-step-banner` (+ modificadores `__step`, `__description`, `__placeholder`) añadidos a `app/globals.css`. Background `--bg-elevated`, borde `--border-default`, radius `--radius-md`, padding 12px 16px, margen 12px 16px 0 (no full-bleed). `flex-shrink: 0` para evitar colapso bajo carga del canvas-shell.
- `aria-live="polite"` para que screen readers anuncien el cambio de step.

## Archivos Creados O Modificados

- `components/memory/StepBanner.tsx` (nuevo)
- `components/memory/MemoryWorkspace.tsx` (import + render)
- `app/globals.css` (bloque `.memory-step-banner`)
- `docs/checkpoints/current-state.md` (Task #5 ✅, Stable Files, verificación)
- `docs/handoffs/2026-05-09-phase-2-1-step-banner.md` (este archivo)

## Decisiones Tomadas

- Reusar `event.label` (ya producido por `describeCommand` en el engine) como descripción en lugar de invocar `explainEvent`. `explainEvent` produce explicaciones conceptuales múltiples (ya cubiertas por `ExplanationPanel`); el banner busca un resumen one-line equivalente al de la referencia, y `event.label` ya es exactamente eso.
- Conservar `memory-workspace__navbar-meta` por ahora; su consolidación con la descripción del banner se difiere a Task #6 (ExplanationPanel) o Task #8 (MemoryWorkspace restructure).
- No introducir animaciones nuevas. Task #11 cubre la pulida visual final.
- `displayStep = min(stepIndex + 1, stepCount)` para evitar mostrar `Step 0:` si `stepIndex` se sobre-clampa, sin reintroducir lógica que ya vive en `MemoryWorkspace`.

## Verificación

```bash
pnpm test    # 12/12 passed
pnpm build   # tsc strict success, route /  9.64 kB / 111 kB First Load
```

Smoke visual en `http://localhost:3001`:

- `tmp-screenshots/screenshot-13-step-banner-default.png` — Estado inicial. Banner al pie del canvas-area con "Initial memory state" cursiva muted. Counter `1 / 4`.
- `tmp-screenshots/screenshot-14-step-banner-step2.png` — Tras 2× Step forward. Banner muestra `Step 3:` ámbar + "Declare local int counter". Canvas dibuja `main()` + `counter int 42`. Counter `3 / 4`.

Comparación con referencia `www.alg0.dev_big-o-notation.png`: caja inferior con prefijo ámbar coincidente. Color, peso y font-family alineados.

## Pendientes

Backlog Phase 2.1 second-pass restante (una tarea por sesión):

6. ⏳ Redesign `ExplanationPanel.tsx`: Code / Explanation tabs arriba; Variables fijo abajo.
7. ⏳ Remove o reducir `OperationTimeline.tsx` (scrub ya en navbar).
8. ⏳ Restructure `MemoryWorkspace.tsx` a 3-columnas estricto.
9. ⏳ Update `app/globals.css` para grid + sidebar + navbar center cluster.
10. ⏳ Verify Syne / DM Sans / JetBrains Mono via `next/font`.
11. ⏳ Final screenshot vs. alg0.dev — iterar hasta alineación visual.
12. ⏳ `pnpm test`, `pnpm lint`, `pnpm build`.

## Próxima Tarea

```text
Lee primero `docs/checkpoints/current-state.md`.

Proyecto: VisualizeIT.
Fase: Phase 2.1 second pass — alg0.dev alignment.
Modo: una tarea por sesión.

Tarea de esta sesión: Tarea #6 del backlog.
Rediseñar `components/memory/ExplanationPanel.tsx`:
- Top tabs: `Code`, `Explanation` (eliminar/mover Variables del set actual de tabs).
- Sección `Variables` pinneada como bloque inferior fijo (no tab), siempre visible mientras se cambia entre Code/Explanation.
- Mantener selected readout y diagnostics dentro del tab Explanation o como sección secundaria — definir según mejor encaje con la referencia.
- Reusar estilos existentes (`.learning-tabs`, `.panel-section`, `.variable-grid`); añadir `.explanation-panel__variables-pinned` con `border-top: 1px solid var(--border-subtle)` y `flex-shrink: 0` al final del panel.
- StepBanner ya muestra el step + descripción, no duplicar esa info en el panel.

Mantener:
- Simulación intacta.
- Snapshots como fuente de verdad.
- ScenarioSidebar.tsx, MemoryControls.tsx, MemoryCanvas.tsx, OperationTimeline.tsx, StepBanner.tsx sin cambios funcionales.
- drawMemoryScene.ts, layoutMemoryScene.ts, engine, fixtures (sólo lectura), pedagogy sin cambios.

Verificar:
- `pnpm test` (12/12).
- `pnpm build` (tsc strict).
- Smoke visual: dev server `localhost:3001`, screenshot Code tab + Explanation tab + Variables fijo abajo.

Actualizar:
- Marcar Tarea #6 ✅ con fecha en `docs/checkpoints/current-state.md`.
- Línea de verificación de Task #6.
- Crear `docs/handoffs/YYYY-MM-DD-phase-2-1-explanation-panel.md`.

Al terminar, marca la tarea #6 como completada y deja las otras 6 como ⏳.
```
