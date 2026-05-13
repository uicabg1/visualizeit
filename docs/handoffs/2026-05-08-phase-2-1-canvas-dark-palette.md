# Handoff: Phase 2.1 second pass — Task 1 (canvas dark palette)

## Objetivo

Migrar el renderer del Canvas (`drawMemoryScene.ts`) a la paleta dark del shell para alinear con la referencia `www.alg0.dev_big-o-notation.png`. La estructura del renderer y `layoutMemoryScene.ts` permanecen intactas.

## Cambios Realizados

- Paleta del renderer movida de cream (`#fff7df`) a dark base `#070b12`.
- Stack: fill translúcido amber `rgba(245, 165, 30, 0.08)` + stroke `#f5a51e` + glow suave (shadowBlur 22).
- Heap (allocated): fill translúcido teal `rgba(6, 214, 160, 0.08)` + stroke `#06d6a0` + glow.
- Heap (freed): fill translúcido púrpura `rgba(167, 139, 250, 0.08)` + stroke `#a78bfa` dasheado.
- Pointer: `#3fa7ff` sólido con glow azul; etiquetas en muted `#6d80a8`.
- Dangling pointer: `#ff3d6e` dasheado con glow rojo.
- Diagnostic badges: glow del color de la severidad.
- Texto principal `#dce6f5`, secundario `#6d80a8`.
- Grid lines y lane fills muy sutiles sobre fondo oscuro (`rgba(63, 167, 255, 0.04)` y `rgba(255, 255, 255, 0.015)` respectivamente).
- Font del canvas alineada a `JetBrains Mono` (con fallback monospace).

## Archivos Creados O Modificados

- `features/memory-engine/rendering/drawMemoryScene.ts` (modificado).
- `docs/checkpoints/current-state.md` (marcada tarea 1 como ✅, agregada sección de verificación).
- `docs/handoffs/2026-05-08-phase-2-1-canvas-dark-palette.md` (este archivo).
- `tmp-screenshots/screenshot-04-dark-canvas-v2.png` (smoke inicial).
- `tmp-screenshots/screenshot-06-dangling.png` (smoke Leak And Dangling Pointer).

## Decisiones Tomadas

- Mantener mismo conjunto de funciones (`drawStackFrame`, `drawHeapBlock`, `drawPointerEdge`, `drawDiagnosticBadge`); solo cambian `colors`, shadows y aplicar `setLineDash` en heap freed.
- Fill translúcidos a 0.08 alpha para que el grid sutil del fondo se siga percibiendo (alineado al hint visual del ref).
- Stroke dasheado en heap freed para reforzar lectura de "released" sin depender solo del color.
- Glow implementado vía `shadowColor` + `shadowBlur` antes del fill, después se limpia y se hace stroke (evita que el stroke se duplique con halo).

## Verificacion

```bash
pnpm test
```

Resultado: 4 archivos, 12 tests, todos pasan. Layout tests intactos.

Smoke visual:

- Dev server: `pnpm dev --port 3001`.
- Screenshots en `tmp-screenshots/screenshot-04-dark-canvas-v2.png` y `screenshot-06-dangling.png`.
- Comparado contra `www.alg0.dev_big-o-notation.png`: tono de fondo, grid, accent colors y nivel de glow alineados.

Notas:

- Durante el smoke inicial el server tenía caché stale de `.next`; tras `rm -rf .next` y reinicio funcionó correctamente. No es un bug del cambio.

## Pendientes

Backlog Phase 2.1 second pass (todas ⏳ excepto la 1):

2. Agregar `category` a scenarios en `fixtures.ts`.
3. Crear `components/memory/ScenarioSidebar.tsx`.
4. Mover playback controls al centro del navbar.
5. Crear `components/memory/StepBanner.tsx`.
6. Redesign `ExplanationPanel.tsx` (tabs Code/Explanation + Variables fijo).
7. Reducir o quitar `OperationTimeline.tsx`.
8. Layout 3-col en `MemoryWorkspace.tsx`.
9. Update `app/globals.css` para grid + sidebar + navbar.
10. Verificar Syne / DM Sans / JetBrains Mono via `next/font`.
11. Final screenshot vs. alg0.dev.
12. Verificar `pnpm test`, `pnpm lint`, `pnpm build`.

## Próxima Tarea

```text
Lee primero `docs/checkpoints/current-state.md`.

Proyecto: VisualizeIT.
Fase: Phase 2.1 second pass — alg0.dev alignment.
Modo: una tarea por sesion.

Tarea de esta sesion: Tarea #2 del backlog.
Agregar campo `category` a cada scenario en features/memory-engine/simulation/fixtures.ts:
- "Fundamentals" para stack frame basics y allocations basicas.
- "Data Structures" para escenarios con structs / linked patterns.
- "Bugs & Pitfalls" para leaks, dangling pointers, double free, use after free.

Mantener:
- Tipos en domain/types.ts coherentes (extender ScenarioDefinition).
- Snapshots y simulacion intactas.
- Tests de fixtures verdes.

Verificar:
- pnpm test.
- Confirmar que cada scenario tiene category asignada.
```
