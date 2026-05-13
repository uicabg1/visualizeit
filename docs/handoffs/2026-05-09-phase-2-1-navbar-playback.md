# Handoff: Phase 2.1 — Navbar Playback Cluster (Task #4)

## Objetivo

Mover los controles de playback al centro del navbar (referencia `www.alg0.dev_big-o-notation.png`) y eliminar la franja inferior `.memory-controls` del canvas-area. Reducir `MemoryControls.tsx` al cluster centrado y mantener `ScenarioSidebar` como única superficie de selección de escenario.

## Cambios Realizados

- `MemoryControls.tsx` reducido al cluster centrado:
  - Eliminado el dropdown `Scenario` (label + select) y los props `scenarios`, `selectedScenarioId`, `onScenarioChange`.
  - Nuevo prop `onStepChange(nextStep: number) => void` que conecta la progress bar a `setStepIndex`.
  - Orden visual exacto del spec: Reset · Step backward · Play/Pause (grande, redondo, `--color-pointer`) · Step forward · Progress bar (`<input type="range">`, accent `--color-pointer`) · Step counter `N / N` (chip mono, `--bg-elevated`) · `SPEED` eyebrow + select (reusa `playbackSpeedOptions`).
  - `aria-valuemin/now/max` en la progress bar usan valores 1-indexed para que screen readers digan "Step X of Y".
- `MemoryWorkspace.tsx`:
  - `<nav>` reorganizada en dos filas. Primera fila (`memory-workspace__navbar-row`) es un grid `1fr auto 1fr`: brand izq, `<MemoryControls />` centrado, slot derecho vacío y reservado para Task #11.
  - Segunda fila (`memory-workspace__navbar-meta`) conserva `scenario.title · description` con borde superior sutil.
  - `<MemoryControls />` removido del `canvas-area`. El area queda con `<MemoryCanvas />` + `<OperationTimeline />` (Task #7 decide su destino).
  - `useEffect` que resetea `stepIndex/isPlaying/selectedId` cuando cambia `scenarioId` se preserva intacto.
- `app/globals.css`:
  - `.memory-workspace__navbar` pasa de `flex` a `flex-direction: column` + dos filas hijas.
  - Nuevos: `.memory-workspace__navbar-row`, `.memory-workspace__navbar-center`, `.memory-workspace__navbar-right`, `.memory-workspace__navbar-meta`.
  - `.memory-controls` se redefine como cluster horizontal sin background propio ni border (vive dentro del navbar). Botones reducidos a 32px, play a 38px circular para mantener altura visual.
  - Nuevos estilos para `.memory-controls__progress` cubriendo `appearance: none`, `::-webkit-slider-thumb`, `::-webkit-slider-runnable-track`, `::-moz-range-thumb`, `::-moz-range-track`, foco accesible.
  - `.memory-controls__scenario` y reglas asociadas eliminadas.
  - Responsive ajustada:
    - `<= 980px`: progress bar baja a 160px de ancho.
    - `<= 720px`: navbar-row colapsa a una sola columna; el cluster usa `flex-wrap`; slot derecho se oculta.
    - `<= 560px`: progress bar pasa a `flex: 1 1 100%` en una segunda línea; botones, step chip y SPEED reorganizan con `order` para no recortar funcionalidad.

## Archivos Creados O Modificados

- Modificados:
  - `components/memory/MemoryControls.tsx`
  - `components/memory/MemoryWorkspace.tsx`
  - `app/globals.css`
  - `docs/checkpoints/current-state.md`
- Creados:
  - `docs/handoffs/2026-05-09-phase-2-1-navbar-playback.md` (este archivo)
  - `tmp-screenshots/screenshot-10-navbar-playback-default.png`
  - `tmp-screenshots/screenshot-11-navbar-leak-active.png`
  - `tmp-screenshots/screenshot-12-navbar-progress-drag.png`

No tocados (verificado): `features/memory-engine/**`, `components/memory/MemoryCanvas.tsx`, `components/memory/ExplanationPanel.tsx`, `components/memory/ScenarioSidebar.tsx`, `components/memory/OperationTimeline.tsx`, `app/layout.tsx`, `app/page.tsx`.

## Decisiones Tomadas

- **Progress bar como `<input type="range">` nativo** en vez de un slider custom: hereda click+drag+teclado gratis, accesible por defecto, `accent-color` resuelve el color del fill en navegadores modernos. Pseudo-elementos `::-webkit-slider-thumb` y `::-moz-range-thumb` se estilan explícitamente para que el thumb sea redondo y con halo, en lugar de depender únicamente de `accent-color`.
- **Scenario meta movido a una segunda fila del `<nav>`** en vez de eliminarlo o redibujarlo. El spec permitía moverlo o quitarlo; mantenerlo conserva contexto sin inventar UI nueva. Si Task #5 (StepBanner) o Task #6 (ExplanationPanel) cubren el mismo contenido, se reevalúa.
- **OperationTimeline se conserva** dentro del canvas-area pese a duplicar parcialmente la progress bar del navbar. La eliminación o reducción a step pills es responsabilidad explícita de Task #7.
- **Slot derecho del navbar queda vacío** (`<div aria-hidden="true" />`) para preservar el balance del grid `1fr auto 1fr` (cluster centrado real, no centrado-según-flex). Listo para EN/ES toggle u otros switches futuros (Task #11).
- **Sin atajos de teclado nuevos**: el spec lo prohíbe explícitamente. Los `title` ya no incluyen sugerencias de tecla (`(R)`, `(Space)`, `(←)`, `(→)`) para no prometer comportamiento que no existe.

## Verificacion

- `pnpm test` → **12/12 pasaron** (vitest 4.1.5, 4 archivos).
- `pnpm build` → **success** (Next 15.5.15, tsc strict, Page Size: 9.52 kB).
- Dev server `pnpm dev --port 3001` levantado, smoke con Playwright headless (1440x900):
  - `screenshot-10-navbar-playback-default.png`: navbar con cluster centrado [Reset · ◄ · ▶ azul redondo · ► · progress · `1 / 4` · SPEED 1x], segunda fila `Stack Frame Basics · Function entry, local declaration, and stack cleanup.`, canvas-area sin franja inferior de controles.
  - `screenshot-11-navbar-leak-active.png`: click en "Leak And Dangling Pointer" del sidebar → counter resetea a `1 / 10`, meta del navbar se actualiza, escenario activo cambia.
  - `screenshot-12-navbar-progress-drag.png`: drag programático de la progress bar a `value=5` → step 6/10, canvas dibuja stack `main()` + heap `Leaked int` + `Dangling int` (mid-malloc); thumb del slider en posición correcta.
  - Smoke programático adicional: Reset → 1/10 ✓, Step forward → 7/10 ✓, Play toggle → estado playing ✓, Speed select → `2x` ✓, sin errores de consola.

## Pendientes

- Task #5: `StepBanner.tsx` (`Step N:` ámbar + descripción al pie del canvas).
- Task #6: rediseño de `ExplanationPanel` con tabs Code/Explanation y Variables fija abajo.
- Task #7: decidir qué hacer con `OperationTimeline` ahora que la progress bar vive en el navbar (eliminar o reducir a step pills).
- Task #8: layout 3-columnas explícito en `MemoryWorkspace`.
- Task #9: refinamientos a `globals.css` (grid + sidebar + cluster) — esta tarea ya cubrió el grid del navbar y el cluster; quedan las cuts del canvas-area + StepBanner + ExplanationPanel.
- Task #10: migrar `app/layout.tsx` a `next/font` para evitar el `@import` de Google Fonts en `globals.css`.
- Task #11: pulido final + slot derecho del navbar (toggles, idioma, etc.).
- Task #12: corrida final de `pnpm test`, `pnpm lint`, `pnpm build`.

`pnpm lint` no se corrió esta sesión (no estaba en el spec del usuario); el TypeScript del build ya pasa estricto.

## Próxima Tarea

Ver bloque `## Next Prompt Recommendation` en `docs/checkpoints/current-state.md` (Task #5: StepBanner.tsx).
