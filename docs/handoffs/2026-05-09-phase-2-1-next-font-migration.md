# Handoff: Phase 2.1 Task #10 — next/font migration

## Objetivo

Eliminar el render-blocking del CDN de Google Fonts y dejar las fuentes Syne / DM Sans / JetBrains Mono auto-hospedadas por Next 15.5.15 vía `next/font/google`, sin tocar layout, colores, tamaños ni componentes.

## Cambios Realizados

- `app/layout.tsx` ahora importa `Syne`, `DM_Sans`, `JetBrains_Mono` desde `next/font/google` con `subsets: ['latin']`, `display: 'swap'`, weights del spec original, fallbacks `system-ui/sans-serif` (mono → `Fira Code/ui-monospace/monospace`), y expone cada familia vía CSS variable (`--font-display`, `--font-body`, `--font-mono`). Las tres clases `.variable` se aplican en `<html className="${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}">`.
- `app/globals.css` elimina la línea 1 `@import url('https://fonts.googleapis.com/...')` y borra las tres declaraciones literales `--font-display: 'Syne', ...` / `--font-body: 'DM Sans', ...` / `--font-mono: 'JetBrains Mono', ...` del `:root`. Las 3 variables ahora vienen inyectadas en `<html>` por next/font; toda referencia `var(--font-display|body|mono)` resuelve por herencia.

## Archivos Creados O Modificados

- `app/layout.tsx` (modified)
- `app/globals.css` (modified — `:root` typography block reducido a comentario; `@import` removido)
- `docs/checkpoints/current-state.md` (Task #10 marcado ✅, bloque de verificación añadido, Next Prompt Recommendation actualizado para Task #11)
- `tmp-screenshots/screenshot-27-task10-default.png` (smoke estado inicial)
- `tmp-screenshots/screenshot-28-task10-leak-scrub.png` (smoke Leak And Dangling Pointer step 6/10)
- `docs/handoffs/2026-05-09-phase-2-1-next-font-migration.md` (este archivo)

## Decisiones Tomadas

- Mantener los weights explícitos del spec original (`Syne 400/500/600/700/800`, `DM Sans 300/400/500/600` + `style: ['normal','italic']`, `JetBrains Mono 400/500/600`) en lugar de migrar a `weight: 'variable'`. Razón: el spec lo pidió explícitamente y next/font subset el axis correctamente para variable fonts.
- Eliminar las 3 declaraciones literales de `--font-display|body|mono` del `:root` (en vez de dejarlas como fallback). Razón: next/font inyecta las mismas variables en `<html>` con mayor especificidad; mantener la doble declaración añadiría confusión sin valor (la cascada ya garantiza el override). Toda referencia `var(--font-*)` resuelve por herencia.
- Sin cambios en componentes ni en `drawMemoryScene.ts` — Canvas usa `ctx.font` con strings literales, no CSS vars, y esos strings ya referencian `'Syne'`/`'DM Sans'`/`'JetBrains Mono'` que coinciden con los nombres reales que next/font registra como `font-family`.

## Verificación

- `pnpm test` → 12/12 passed.
- `pnpm build` → success (tsc strict + Next compile, sin warnings de fonts; 5 páginas estáticas; First Load JS 111 kB).
- `pnpm exec eslint app components features` → clean.
- Smoke programático (Playwright) en `localhost:3000`:
  - `externalFontHits = []` (0 requests a `fonts.googleapis.com` ni `fonts.gstatic.com` desde el cliente).
  - `consoleErrors = []`.
  - Cambio de scenario via sidebar a `Leak And Dangling Pointer` + 5× ArrowRight sobre `.memory-controls__progress` → step `6 / 10`, banner `Step 6: Dangling int`.
  - Render visual: brand `VisualizeIT` y headings STACK/HEAP en Syne; sidebar items, banner, explanation copy en DM Sans; addresses 0x1000/0x1004, code-steps 01–09, step counter en JetBrains Mono.

## Pendientes

- Tarea #11 — Final screenshot vs. alg0.dev — iterar hasta alineación visual.
- Tarea #12 — Verificación final con `pnpm test`, `pnpm lint`, `pnpm build`.

## Próxima Tarea

Ver `docs/checkpoints/current-state.md` → sección "Next Prompt Recommendation" (Tarea #11).
