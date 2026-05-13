# Handoff: Phase 2.1 Second Pass — Scenario Sidebar (Task #3)

## Objetivo

Introducir la columna izquierda fija del shell estilo alg0.dev: search + escenarios agrupados por `category` con estado activo, sin tocar simulación, render ni el dropdown actual de `MemoryControls`. El dropdown se mantiene como fallback temporal hasta que la Task #4 (mover playback al navbar) lo desplace.

## Cambios Realizados

- Nuevo componente `components/memory/ScenarioSidebar.tsx`:
  - `<aside>` 220px, full-height, `--bg-base`, borde derecho `--border-subtle`.
  - Search controlled por `useState`, filtro case-insensitive sobre `scenario.title`. Grupos vacíos se ocultan vía `useMemo`.
  - Orden fijo de categorías: `Fundamentals → Data Structures → Bugs & Pitfalls`.
  - Cada grupo: header eyebrow uppercase + count chip por grupo. Footer fijo con count total `"<n> algorithms · by visualizeit"`.
  - Items renderizados como `<button>` con `aria-current="true"` en el activo, `border-left 2px var(--color-pointer)`, color `var(--color-pointer)`, fondo `rgba(63,167,255,0.07)`.
  - Search input con icono lupa (SVG inline) y chip visual "/" (`pointer-events: none`, sin handler de tecla — sólo afordancia visual).
- `components/memory/MemoryWorkspace.tsx`:
  - Import de `ScenarioSidebar`.
  - Sidebar añadido como primer hijo del grid `memory-workspace__main`. `selectedScenarioId={scenarioId}` y `onScenarioChange={setScenarioId}` reutilizan el mismo handler que el dropdown — el `useEffect` existente sigue reseteando step, isPlaying y selectedId al cambiar scenario.
- `app/globals.css`:
  - `.memory-workspace__main` grid pasa de `minmax(0,1fr) 340px` a `220px minmax(0,1fr) 340px`.
  - Bloque nuevo `─── Scenario sidebar ───` con todas las clases (`.scenario-sidebar`, `__search`, `__shortcut`, `__groups`, `__group`, `__group-header`, `__group-count`, `__list`, `__item`, `__item.is-active`, `__footer`).
  - Overrides defensivos para que el reset global de `button { ... }` (border, background, box-shadow, transform en hover/active) no “contamine” los items del sidebar.
  - Media query `max-width: 980px` añade `.scenario-sidebar { display: none }` para mantener una sola columna en mobile (el dropdown de MemoryControls cubre ese caso).

## Archivos Creados O Modificados

Creados:

- `components/memory/ScenarioSidebar.tsx`
- `docs/handoffs/2026-05-08-phase-2-1-scenario-sidebar.md`

Modificados:

- `components/memory/MemoryWorkspace.tsx`
- `app/globals.css`
- `docs/checkpoints/current-state.md`

No tocados (por diseño):

- `features/memory-engine/**` (engine, fixtures sólo lectura, pedagogy, rendering, snapshots).
- `components/memory/MemoryCanvas.tsx`, `MemoryControls.tsx`, `OperationTimeline.tsx`, `ExplanationPanel.tsx`.

## Decisiones Tomadas

- **Dropdown coexiste con sidebar.** El spec lo pide explícitamente; ambos llaman a `setScenarioId`, así que el estado siempre está sincronizado (verificado: screenshot 08 muestra dropdown reflejando el item del sidebar).
- **"/" es sólo visual.** No se conectó listener de teclado para mantener el diff al mínimo de Task #3. Si se quiere foco real, queda como mejora rápida (un `useEffect` con `keydown` y `ref` al input).
- **Grupos ocultos cuando filtran a vacío**, pero el footer **siempre muestra el total no filtrado** (`scenarios.length`). Coincide con la convención de alg0.dev, donde el contador inferior es identitario del catálogo, no del filtro.
- **Item activo no se pierde aunque quede filtrado.** Si el usuario busca y el escenario activo ya no aparece, el `scenarioId` del workspace permanece — el canvas y el dropdown siguen mostrando ese escenario; al limpiar el filtro vuelve a verse marcado en azul.
- **Mobile fallback = ocultar sidebar**, no transformar a drawer. Es el camino menos invasivo dado que el dropdown ya cubre la elección. El drawer queda como decisión futura si Task #11 lo justifica.
- **No se introdujeron iconos por categoría** (alg0.dev usa lightbulb / hexágono / sort-arrows). El spec sólo pide “header eyebrow uppercase”, así que se mantiene tipográfico para no expandir scope.

## Verificación

```bash
pnpm test   # 12/12 passed (4 test files)
pnpm build  # ✓ Compiled successfully, tsc strict OK, 5/5 static pages
```

Smoke visual en `http://localhost:3001` (dev server existente):

- `tmp-screenshots/screenshot-07-sidebar-default.png` — estado inicial: sidebar 220px, search con icono + chip "/", grupos `FUNDAMENTALS (2)` / `DATA STRUCTURES (1)` / `BUGS & PITFALLS (1)`, `Stack Frame Basics` activo (azul + border-left + bg sutil), footer `4 algorithms · by visualizeit`.
- `tmp-screenshots/screenshot-08-sidebar-leak-active.png` — tras click programático en `Leak And Dangling Pointer` desde el sidebar (después de avanzar 2 steps en `Stack Frame Basics`):
  - Step counter pasa de `3 / 4` → `1 / 10` (reset confirmado vía el `useEffect` existente del workspace).
  - Sidebar marca `Leak And Dangling Pointer` como activo y `Stack Frame Basics` vuelve a `--text-secondary`.
  - Dropdown de `MemoryControls` reporta `value === "leak-and-dangling-pointer"` (sincronía bidireccional vía `scenarioId`).
- `tmp-screenshots/screenshot-09-sidebar-search-heap.png` — query `heap`: sólo se renderiza el grupo `FUNDAMENTALS (1)` con `Heap Allocation`. Los demás grupos quedan ocultos. Footer mantiene `4 algorithms · by visualizeit`.

Comparación contra `www.alg0.dev_big-o-notation.png`:

- Estructura de columna izquierda, búsqueda con chip, grupos con count chip y item activo coinciden.
- Diferencias deliberadas: nuestros grupos no tienen icono ni chevron de colapso (out of scope para Task #3), y el footer dice `4 algorithms · by visualizeit` en lugar de `39 algorithms · by midudev`.

## Pendientes

Backlog Phase 2.1 second pass — siguen `⏳`:

4. Mover playback (← ▶ →), progress bar, step counter `N / N` y SPEED al centro del navbar; redibujar `MemoryControls.tsx`.
5. `components/memory/StepBanner.tsx` — banner inferior del canvas con prefijo amber `Step N:` + descripción del evento.
6. Rediseñar `ExplanationPanel.tsx`: tabs Code / Explanation arriba, Variables fija como sección inferior.
7. Decidir destino de `OperationTimeline.tsx` (eliminar o reducir a step pills compactos) una vez la barra de progreso esté en navbar.
8. Reestructurar `MemoryWorkspace.tsx` al layout 3 columnas final una vez Task #4 mueva los controles.
9. CSS final del nuevo grid + cluster central de navbar.
10. Verificar carga de Syne / DM Sans / JetBrains Mono (considerar migrar `app/layout.tsx` a `next/font`).
11. Screenshot final vs. alg0.dev — iterar hasta alineamiento visual.
12. `pnpm test`, `pnpm lint`, `pnpm build` finales.

Notas:

- Dropdown del `MemoryControls` se removerá en Task #4 cuando los controles de scenario migren al navbar y el sidebar quede como única superficie de selección.
- Si en algún momento se quiere que `/` enfoque el search, basta agregar un `useEffect` global con `keydown` que llame a `inputRef.current?.focus()` ignorando teclas dentro de inputs/textareas.

## Próxima Tarea

```text
Lee primero `docs/checkpoints/current-state.md`.

Proyecto: VisualizeIT.
Fase: Phase 2.1 second pass — alg0.dev alignment.
Modo: una tarea por sesión.

Tarea de esta sesión: Tarea #4 del backlog.
Mover los controles de playback al centro del navbar:
- Cluster centrado: ← ▶ →, progress bar fina, step counter `N / N`, etiqueta SPEED + select.
- Quitar del bottom-of-canvas el dropdown de Scenario (el sidebar ya cubre selección) y el cluster de playback duplicado.
- Mantener toggles de teclado (Space, ←, →, R) si ya existían; si no, no introducirlos en esta tarea.
- Conservar `OperationTimeline` por ahora (Task #7 decide su destino).

Mantener:
- Simulación intacta.
- Snapshots como fuente de verdad.
- ScenarioSidebar.tsx, drawMemoryScene.ts, layoutMemoryScene.ts, engine, fixtures (lectura), pedagogy sin cambios.
- ExplanationPanel sin cambios funcionales.

Verifica:
- pnpm test (12/12).
- pnpm build (tsc strict).
- Smoke visual en localhost:3001 + screenshot del navbar centrado.

Documentación:
- Marcar Task #4 ✅ en current-state.md con fecha y línea de verificación.
- Crear docs/handoffs/YYYY-MM-DD-phase-2-1-navbar-playback.md.
```
