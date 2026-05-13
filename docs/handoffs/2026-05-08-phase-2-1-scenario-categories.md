# Handoff: Phase 2.1 second pass — Task #2 scenario categories

## Objetivo

Agregar el campo `category` a los escenarios del Memory Engine para preparar el sidebar agrupado (Task #3) sin tocar UI todavia. Cambio aditivo en datos + tipo, fuera del dominio de simulacion.

## Cambios Realizados

- Nuevo tipo `MemoryScenarioCategory = "Fundamentals" | "Data Structures" | "Bugs & Pitfalls"` co-localizado en `features/memory-engine/simulation/fixtures.ts`.
- Campo `category: MemoryScenarioCategory` agregado al type `MemoryScenario`, posicionado entre `title` y `description`.
- Categorias asignadas a los 4 escenarios existentes:
  - `stack-frame-basics` → `Fundamentals`
  - `heap-allocation` → `Fundamentals`
  - `struct-with-pointer` → `Data Structures`
  - `leak-and-dangling-pointer` → `Bugs & Pitfalls`
- `current-state.md` actualizado: Task #2 marcada ✅ con linea de verificacion.

## Archivos Creados O Modificados

- `features/memory-engine/simulation/fixtures.ts` (M) — tipo + campo + 4 valores.
- `docs/checkpoints/current-state.md` (M) — Task #2 ✅ + verificacion.
- `docs/handoffs/2026-05-08-phase-2-1-scenario-categories.md` (A) — este handoff.

## Decisiones Tomadas

- **String literal union, no enum.** Coincide con el estilo del repo (`PointerStatus` en `domain/types.ts:16`). Sin runtime overhead, autocomplete completo.
- **Tipo en `fixtures.ts`, no en `domain/types.ts`.** Es metadato pedagogico de presentacion, no parte del dominio de simulacion. Mantiene la separacion engine vs UI/pedagogia que pide la metodologia.
- **Strings exactas del backlog reutilizables como labels.** `"Fundamentals"` / `"Data Structures"` / `"Bugs & Pitfalls"` se pueden mostrar tal cual en el sidebar de Task #3 sin mapeo intermedio.
- **Posicion del campo entre `title` y `description`.** Orden semantico: que es → de que tipo → que hace.
- **Cero cambios en consumers.** `MemoryControls`, `MemoryWorkspace`, ambos test files (memoryEngine/layoutMemoryScene) e ignoran `category` por ahora; sigue todo verde.

## Verificacion

```bash
pnpm test
# Test Files  4 passed (4)
# Tests       12 passed (12)

pnpm build
# Compiled successfully (tsc strict valida category en los 4 escenarios)

pnpm exec eslint features/memory-engine/simulation/fixtures.ts
# clean
```

`pnpm lint` global reporta 31 errores en `.agents/skills/ckm-brand/...` y `.agents/skills/ckm-design-system/...` (scripts CommonJS de plugins). Son pre-existentes, fuera del scope del MVP, y no fueron introducidos por este cambio.

Smoke visual en navegador no aplica: cero cambios visibles en UI hasta Task #3.

## Pendientes (Phase 2.1 second pass backlog)

- Task #3 ⏳ — `components/memory/ScenarioSidebar.tsx` (~220px, search input, escenarios agrupados por `category` con estado activo).
- Task #4 ⏳ — Mover playback (← ▶ →), progress bar, step counter, SPEED al centro del navbar.
- Task #5 ⏳ — `components/memory/StepBanner.tsx` (banner inferior con prefijo amber `Step N:`).
- Task #6 ⏳ — Redisenar `ExplanationPanel.tsx`: tabs Code/Explanation arriba; Variables fijo abajo.
- Task #7 ⏳ — Remover/reducir `OperationTimeline.tsx`.
- Task #8 ⏳ — Layout 3 columnas en `MemoryWorkspace.tsx`.
- Task #9 ⏳ — `app/globals.css` para nuevo grid + sidebar + navbar center.
- Task #10 ⏳ — Verificar Syne / DM Sans / JetBrains Mono via `next/font`.
- Task #11 ⏳ — Screenshot final vs `www.alg0.dev_big-o-notation.png`.
- Task #12 ⏳ — Verificacion completa con `pnpm test`, `pnpm lint`, `pnpm build`.

## Próxima Tarea

```text
Lee primero `docs/checkpoints/current-state.md`.

Proyecto: VisualizeIT.
Fase: Phase 2.1 second pass — alg0.dev alignment.
Modo: una tarea por sesion.

Tarea de esta sesion: Task #3 del backlog.
Crea components/memory/ScenarioSidebar.tsx:
- Columna izquierda fija ~220px.
- Search input arriba con icono lupa.
- Escenarios agrupados por `category` (lectura desde fixtures.ts).
- Estado activo destacado (border + texto primary).
- Mantener simulacion intacta y snapshots como fuente de verdad.

Mantener:
- drawMemoryScene.ts y layoutMemoryScene.ts sin cambios.
- Engine sin cambios.
- No tocar navbar todavia (eso es Task #4).

Verifica:
- pnpm test (no debe romperse).
- Smoke visual en localhost:3001.

Al terminar marcar Task #3 como ✅ y dejar las otras 9 como ⏳.
```
