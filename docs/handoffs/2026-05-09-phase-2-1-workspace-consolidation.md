# Handoff: Phase 2.1 Task #8 — Workspace Layout Consolidation

## Objetivo

Validar y consolidar el layout 3-column de `components/memory/MemoryWorkspace.tsx` (`[ScenarioSidebar] [canvas + StepBanner] [ExplanationPanel]`), eliminar markup redundante y ajustar spacing/alineación contra `www.alg0.dev_big-o-notation.png`.

## Cambios Realizados

- `components/memory/MemoryWorkspace.tsx`: removido `<div className="memory-workspace__navbar-right" aria-hidden="true" />`. La columna `auto` del grid `1fr auto 1fr` sigue centrando el cluster de controles aun con sólo dos hijos (brand + center).
- `app/globals.css`:
  - Removida regla `.memory-workspace__navbar-right { min-height: 1px; }` (huérfana).
  - Removida variante `.memory-workspace__navbar-right { display: none; }` dentro del media query `max-width: 720px` (huérfana).
  - `.memory-canvas-shell` recibió `display: grid; place-items: center` para que el canvas absorba el espacio disponible y se centre vertical+horizontalmente, sin perder `overflow: auto` para escenas largas.
  - `.memory-step-banner` ajustado de `margin: 12px 16px 0` a `margin: 12px 16px 16px` para breathing room al pie del canvas-area.

Estructura final dentro de `<main className="memory-workspace">`:

```tsx
<nav className="memory-workspace__navbar">
  <div className="memory-workspace__navbar-row">
    <div className="memory-workspace__brand">…</div>
    <div className="memory-workspace__navbar-center">
      <MemoryControls … />
    </div>
  </div>
  <div className="memory-workspace__navbar-meta">…</div>
</nav>

<div className="memory-workspace__main">
  <ScenarioSidebar … />
  <div className="memory-workspace__canvas-area">
    <MemoryCanvas … />
    <StepBanner … />
  </div>
  <ExplanationPanel … />
</div>
```

## Archivos Creados O Modificados

- `components/memory/MemoryWorkspace.tsx` (modificado)
- `app/globals.css` (modificado)
- `docs/checkpoints/current-state.md` (Task #8 marcada ✅, prompt siguiente actualizado)
- `docs/handoffs/2026-05-09-phase-2-1-workspace-consolidation.md` (nuevo)
- `tmp-screenshots/screenshot-21-task8-default.png` (nuevo, baseline pre-centrado)
- `tmp-screenshots/screenshot-22-task8-centered.png` (nuevo, post centrado canvas)
- `tmp-screenshots/screenshot-23-task8-leak-scrub.png` (nuevo, smoke scenario switch + scrub)

## Decisiones Tomadas

1. Drop de `navbar-right` en lugar de cambiar `grid-template-columns`. Razón: `1fr auto 1fr` con dos hijos sigue colocando el segundo hijo en la columna `auto` (track 2), centrado entre dos `1fr` tracks vacíos. Cambiar a flex con `justify-content: space-between` habría desplazado el cluster a la derecha al no haber tercer slot — peor outcome.
2. Centrado del canvas vía `display: grid; place-items: center` en `.memory-canvas-shell` en lugar de `display: flex; align-items: center; justify-content: center`. Razón: grid+place-items maneja mejor el `overflow: auto` cuando la escena excede el shell (el contenido scrollea sin clipping del top, a diferencia de flex centering).
3. Banner permanece como hijo directo de `.memory-workspace__canvas-area` con `flex-shrink: 0` (el shell consume `flex: 1`). Patrón ya existente — no se introdujo wrapper extra.

## Verificacion

- `pnpm test` → 4 files / 12 tests passed.
- `pnpm build` → success, tsc strict, 5 static pages generadas, `/` route 9.35 kB / 111 kB First Load JS.
- Smoke en `http://localhost:3000`:
  - Default Stack Frame Basics: navbar `1 / 4`, sidebar 220px con grupos Fundamentals/Data Structures/Bugs & Pitfalls, canvas STACK/HEAP centrado, panel Code tab + Variables pinned, StepBanner `Initial memory state`. (`screenshot-22-task8-centered.png`)
  - Cambio scenario via sidebar → Leak And Dangling Pointer + scrub navbar a `value=5` → step `6 / 10`: stack `main()` con `leaked`/`dangling`, heap con `Leaked int`/`Dangling int` allocated, pointer edges azules, line 05 `Dangling int` highlighted, chips Variables completos, StepBanner `Step 6: Dangling int`. (`screenshot-23-task8-leak-scrub.png`)

## Pendientes

- Task #9: depurar `app/globals.css` — auditar selectores muertos, normalizar tokens de spacing.
- Task #10: verificar carga de Syne / DM Sans / JetBrains Mono (considerar migrar `app/layout.tsx` a `next/font`).
- Task #11: iteración final de screenshot vs. alg0.dev.
- Task #12: verificación completa (`pnpm test`, `pnpm lint`, `pnpm build`).

## Próxima Tarea

Ver bloque `Next Prompt Recommendation` en `docs/checkpoints/current-state.md` (Task #9: globals.css cleanup).
