# VisualizeIT — Backlog (Phase 2.5 → Phase 3)

**Last updated:** 2026-10-03 — Refactor Queue T-REFACTOR-1→12 (T1 ✅ T2 ✅ T3 ✅ T4a ✅ T4b ✅ T5 ✅ T6 ✅ T7 ✅; T8 next, then T9–11 P2, T12 P3). One task = one branch, token-saving rules
**Live:** https://visualizeit-two.vercel.app
**Tests:** 73 green · `pnpm test`
**Build:** `pnpm build` · Route `/` ~15.4 kB

---

## How to use this doc

1. **One task per session.** Pick the highest-priority task that isn't already in flight.
2. **Always read first:** `docs/handoffs/2026-05-12-phase-2-recursive-stack-context.md` (last session outcome) + the relevant section below.
3. **When done:** append a "What Was Done (Task N)" block to the handoff doc, move the completed task to the **Done** section at the bottom.
4. **Priorities:**
   - **P0** = blocks users in production.
   - **P1** = high-value UX / educational impact.
   - **P2** = nice-to-have, batch later.
   - **P3** = long-horizon (WASM, etc.).

---

## Refactor Queue (Phase 2.5 hardening) — T-REFACTOR-1 → 12

Approved 2026-09-28 after full-project review. Goal: make "add new scenario" safe + freeze snapshot/target schema before Phase 3 WASM.

**Session protocol — one task = one branch = one session** (split if >5 files touched):

1. Branch from latest `main`: `refactor/<id>` (`fix/<id>` if behavior bug).
2. Apply edit at pinned `file:line` below. **Do not re-read whole files** — anchor on line, grep only what you need.
3. Verify before merge: scoped `pnpm exec vitest run <touched>.test.ts` → full `pnpm test` → `pnpm lint` (scope `app components features`) → `pnpm build`. Browser smoke only if UI touched.
4. Merge to `main`, deploy only at user request. Append "What Was Done" to the 2026-05-12 handoff.
5. Never merge with red tests. Revert = delete branch; `main` stays clean.

**Token-saving rules (ahorrador mode) — mandatory for subagents:**

- Agents configured in `.opencode/agent/` (restart opencode to load): `cavecrew-investigator` (locate, read-only, bash deny), `cavecrew-builder` (edits scoped to files in its prompt, zero exploration), `cavecrew-reviewer` (diff-only, git bash only). Top-level `opencode.json` permission = allow all (no prompts).
- Main thread reads each file **once per task**, passes snippets to subagents inline.
- Locate → `cavecrew-investigator` only, one search pass, output = `file:line` refs only.
- Edit → `cavecrew-builder`, prompt MUST include target files + line anchors + snippet; it returns `MISSING: <what>` instead of exploring if context is short.
- Review → `cavecrew-reviewer`, diff-only, max 8 comments.
- No vanilla `Explore`/`general` agents for these tasks (they re-read everything).
- Prefer `grep -n pattern file` over `Read` full file. Read max window: ±30 lines around anchor.

**Order of necessity:** 1–3 = safety net before any new scenario. 4–7 = structural prep for new regions/lanes. 8–9 = cleanup. 10–11 = schema freeze for WASM parity. 12 = allocator model, Phase 3 gate.

### ~~T-REFACTOR-1 — Single source of scenario truth~~ · **DONE 2026-09-28** (`refactor/t-refactor-1`) — see handoff "What Was Done (T-REFACTOR-1)"

- **Problem:** counts/metadata hardcoded, already stale: `components/memory/PhoneGate.tsx:41` says "7 scenarios" (real: 8). `components/memory/MemoryWorkspace.tsx:419` "8 scenarios". `app/about/page.tsx:6,110` "8/Eight". `app/about/page.tsx:9-` keeps a **duplicated scenario list** (titles/categories/descriptions diverging from fixtures).
- **Fix:** derive all copy from `memoryEngineScenarios.length`; rewrite about-page list to `map(memoryEngineScenarios)` (fixtures = pure data, server-importable; verify it has no "use client" deps — it doesn't). Keep `color` mapping local to about page if needed (`category` → color already derivable).
- **Acceptance:** zero literal scenario counts in TSX; `grep -rn "scenarios.length\|8 scenarios\|7 scenarios" components app` clean; tests green (fixtures still 8).

### ~~T-REFACTOR-2 — Fixture validator + throw→diagnostic~~ · **DONE 2026-09-28** (`refactor/t-refactor-2`) — see handoff "What Was Done (T-REFACTOR-2)"

- **Problem:** engine `throw`s on malformed commands (`features/memory-engine/simulation/memoryEngine.ts:84,108,115,132,139,233,280,331`). Throws inside `useMemo` (`MemoryWorkspace.tsx:56`) → typo in a new scenario crashes whole page in prod. No invariant tests today (`memoryEngine.test.ts:141` checks labels/length only).
- **Fix (2 steps, same branch):**
  1. New `simulation/validateScenario.ts` (pure fn) + tests: every scenario runs without throw; `stepToLine.length === commands.length`; all `stepToLine` indices in `codeLines` bounds; all referenced `blockId`/variable targets exist by sim-run; ids unique. Wire into `memoryEngine.test.ts` as `describe.each` over scenarios.
  2. Convert engine `throw`s to `createDiagnostic(..., "error", ...)` + no-op for bad targets (keep `runMemoryProgram` total). Check `explainEvent.ts` + `layoutMemoryScene.ts` tolerate new diagnostic types (Set dedupe already there).
- **Risk note:** step 2 changes behavior only for invalid programs — all 8 current scenarios must produce byte-identical snapshots (assert with `toEqual` golden before/after in same test file).
- **Acceptance:** deliberate bad fixture in a test → snapshots returned, diagnostic emitted, no throw; `pnpm test` green.

### ~~T-REFACTOR-3 — WRITE_ARRAY_INDEX consistency~~ · **DONE 2026-09-28** (`refactor/t-refactor-3`) — see handoff "What Was Done (T-REFACTOR-3)"

- **Problem:** `memoryEngine.ts:276-289` skips `allocated` check (WRITE_FIELD emits `USE_AFTER_FREE`, array-index doesn't), skips `capacity` check (no `BUFFER_OVERFLOW`), and `fields[index] = …` past end creates array holes → `undefined` nodes break `layoutMemoryScene` field maps (`.map` over holes = undefined rect → draw crash).
- **Fix:** mirror WRITE_FIELD guards (allocated → USE_AFTER_FREE, capacity → BUFFER_OVERFLOW when `index >= capacity > 0`); keep dense-array semantics: append (no holes) when index === length, diagnostic + skip (or zero-fill, pick one and pin in comment… decide: **zero-fill to index**, pedagogically honest for C).
- **Acceptance:** new tests: write on freed block → USE_AFTER_FREE; `[9]` on capacity-8 → BUFFER_OVERFLOW; `fields` never contains `undefined` (test scans).

### ~~T-REFACTOR-4 — Split MemoryWorkspace~~ · **SPLIT 2026-09-28** → 4a + 4b (fix list = 7 files > 5-file guard)

- **Problem:** 442 lines, 15 state/ref + 8 effects + ~90 JSX lines with inline styles (`MemoryWorkspace.tsx:251-336` Focus/Share/About buttons) — only file using inline styles; `overlayBg()` rendered twice (`:438-439`).

### ~~T-REFACTOR-4a — Extract workspace hooks~~ · **DONE 2026-09-28** (`refactor/t-refactor-4a`) — see handoff "What Was Done (T-REFACTOR-4a)"

- **Fix:** pure move into `components/memory/hooks/`: `useUrlState.ts` (`MemoryWorkspace.tsx:24-31,117-123`), `usePlayback.ts` (`:38,40,163-178`), `useMediaViewport.ts` (`:45,109-115` + phone check). No logic rewrite. Files: 4 (3 new + workspace).
- **Acceptance:** `pnpm test` green (engine untouched); smoke: deep-link restore, play/pause/speed, tablet drawer + phone gate unchanged.

### ~~T-REFACTOR-4b — Extract toolbar + welcome overlay~~ · **DONE 2026-09-28** (`refactor/t-refactor-4b`) — see handoff "What Was Done (T-REFACTOR-4b)"

- **Fix:** after 4a. `components/memory/WorkspaceToolbar.tsx` (`:251-336` Focus/Share/About + copied state, inline styles → globals.css classes) + `components/memory/WelcomeOverlay.tsx` (overlayBg/renderWelcomeOverlay as-is, dedupe `:438-439`). Files: 4 (2 new + workspace + globals.css).
- **Acceptance:** workspace <200 lines; zero `style={{` in components/; smoke: fullscreen/share/drawer/welcome unchanged behavior.

### ~~T-REFACTOR-5 — BrandMark component~~ · **DONE 2026-09-28** (`refactor/t-refactor-5`) — see handoff "What Was Done (T-REFACTOR-5)" · **P1**

- **Problem:** logo SVG duplicated 4× + icon: `MemoryWorkspace.tsx:224-227`, `:410-414` (in overlay too — 5 instances), `PhoneGate.tsx:25`, `app/about/page.tsx:81`, `app/icon.svg`. Hex `#F5B82E` hardcoded (token exists: `--accent-amber`, `globals.css:56`).
- **Fix:** `components/BrandMark.tsx` (size prop, `currentColor`/var-based fills), swap all TSX uses. Leave `app/icon.svg` (static asset).
- **Acceptance:** `grep -rn "F5B82E" components app` = 0 hits; visual smoke unchanged.

### ~~T-REFACTOR-6 — layoutFrame extraction~~ · **DONE 2026-09-28** (`refactor/t-refactor-6`) — see handoff "What Was Done (T-REFACTOR-6)" · **P1**

- **Problem:** `layoutMemoryScene.ts:171-227` (live frames) and `:231-269` (released ghosts) ~55 duplicated lines. New region lanes (T-CONTENT-4/7 static/rodata) would copy a third time.
- **Fix:** extract shared `layoutFrame(frame, y, opts, isReleased)` returning `{node, nextY, pointerSources, selectables}`. Output identical — assert via scene snapshots on 3 region scenarios (`stack-frame-basics`, `recursive-stack`, buffer-overflow ghosts).
- **Acceptance:** `layoutMemoryScene.test.ts` green + `deepEqual` check old vs new output before merge.

### ~~T-REFACTOR-7 — tweenRenderModel complete contract~~ · **DONE 2026-10-03** (`refactor/t-refactor-7`) — see handoff "What Was Done (T-REFACTOR-7)" · **P1**

- **Problem:** tween loses optional fields; consumer patches manually at `MemoryCanvas.tsx:75` (`{...tweened, stackLane, heapLane, releasedFrames}` — documented "critical fix"). Any future optional field = new landmine.
- **Fix:** `tweenRenderModel` (rendering/interpolateScene.ts) passes through all non-tweenable fields itself; delete patch in canvas. Keep t=1 direct-paint path.
- **Acceptance:** `interpolateScene.test.ts` adds case asserting lanes/ghosts present at t=0.5; step-through smoke with ghost frames visible mid-tween.

### T-REFACTOR-8 — Dead code prune · **P2**

- `domain/snapshots.ts:31-45`: `cloneSnapshot`, `getSnapshotSummary` — zero consumers (leftover from Phase 1 debug view). `getFinalSnapshot` keep (test consumer). Delete both + grep-confirm 0 refs.

### T-REFACTOR-9 — URL sync first-mount guard · **P2**

- **Problem:** `MemoryWorkspace.tsx:117-123` rewrites clean `/` → `/?scenario=stack-frame-basics&step=0` on first mount.
- **Fix:** skip replace when derived params equal current URL (compare against `window.location.search` inside the debounce).
- **Acceptance:** load `/` → URL stays `/`; deep link `?scenario=buffer-overflow&step=4` still restores + updates on step.

### T-REFACTOR-10 — MemoryRef target model · **P2 · schema freeze for WASM**

- **Problem:** `ValueTarget` = `variable | heapField` only (`domain/types.ts:27-36`); `PointerValue.targetBlockId` points only to heap blocks (`:18-23`). Blocks T-CONTENT-2 (stack arrays) + T-CONTENT-3 (`**pp` → pointer to stack variable).
- **Fix:** generalize `ValueTarget` → add `{kind:"stackSlot", frameHint?, name, index?}`; `PointerValue` add optional `targetVariable?: {frameId, name}` (pointer-to-stack). Engine: resolver fn per union member (switch already centralized in read/writeTarget). Layout/draw/pedagogy: handle new variants minimally (render pointer edge to frame row).
- **Order:** land BEFORE first scenario that needs it, then **snapshot schema is frozen** → Phase 3 parity target. ADR-002 note if semantics change.
- **Acceptance:** all 8 current snapshots byte-identical (union additions optional-only); new tests with `**pp` fixture (no scenario UI needed).

### T-REFACTOR-11 — Golden parity vectors · **P2 · WASM harness**

- **Fix:** `memoryEngine.test.ts` addition: for each of 8 scenarios run engine, `JSON.stringify(final snapshot)` hash pinned in table (or `__snapshots__`-style file in test dir). Also assert JSON round-trip equality per snapshot (serializability invariant — worker/WASM boundary requires it; `event.command` currently serializable, keep it).
- **Payoff:** regression net for every new scenario + ready-made TS↔WASM parity harness for Phase 3. Pure test, zero product risk.

### T-REFACTOR-12 — Allocator model (first-fit, gaps) · **P3 · Phase 3 gate**

- **Problem:** `nextAddress += size` linear, no gaps (`memoryEngine.ts:196`) → `HEAP_FRAGMENTATION` diagnostic is decorative. Real fragmentation scenarios (incl. the "new scenario" candidates: fragmentation, realloc) impossible without allocator model. This is also the honest WASM port target (per `docs/roadmap/phase-3-wasm-overview.md` + ADR-001: WASM justified by model depth/case study, not by current perf — TS reducer is microseconds).
- **Scope:** TS first — free-list allocator, addresses can gap, `HEAP_FRAGMENTATION` derived from actual layout; THEN port the allocator to WASM as Phase 3 core.
- **Do not start** without explicit approval (guardrail).

---

## Project context (terse)

Next.js App Router app at `app/page.tsx` rendering `<MemoryWorkspace />` (client) inside `<Suspense>`. State machine in `features/memory-engine/`:

- `simulation/fixtures.ts` — 8 scenarios (id, label, category, commands[], codeLines, stepToLine).
- `simulation/memoryEngine.ts` — reducer: commands → snapshots[]. 49 tests in `memoryEngine.test.ts`.
- `pedagogy/explainEvent.ts` — snapshot → human explanation lines. Recursive- and diagnostic-aware.

UI in `components/memory/`:
- `MemoryWorkspace.tsx` — orchestrator. Owns scenario selection, step index, play/pause, URL sync (`?scenario=&step=`), keyboard shortcuts (Space/Arrows/F/Esc), Share button, welcome overlay state machine, fullscreen mode, tablet drawer, ResizeObserver feeding `containerWidth` into `layoutMemoryScene`.
- `MemoryCanvas.tsx` — Canvas2D renderer. Hit-test for click selection. No fitRatio (removed Task 9).
- `ScenarioSidebar.tsx` — scenario list grouped by category, search.
- `ExplanationPanel.tsx` — Code tab (real C source w/ `.is-active` line highlight) + Explanation tab (pedagogy lines).
- `StepBanner.tsx` — step indicator. `MemoryControls.tsx` — navbar playback cluster. `PhoneGate.tsx` — <768px gate with Copy Link. (T16 step-dots added then removed in `9ca932f` — navbar progress fill is the indicator.)

Layout: `app/globals.css` tokens (`--accent-amber`, `--color-pointer`, `--bg-base/elevated/floating`, `--border-default`, `--text-primary/secondary/muted`, `--radius-sm`).

Static page: `app/about/page.tsx`.

Deploy: `vercel deploy --prod -y --scope uicabgadiel67-1227s-projects` (CLI authenticated; `.vercel/project.json` linked).

---

## UX / interaction

### T17 — Multi-viewport strategy (hybrid: tablet responsive + phone gate) · **P0**

> **Strategy decision (2026-05-14):** Full responsive to 375px compromises pedagogy — stack frames + heap blocks + pointers need horizontal space, single-column phone view forces scrolling between canvas and explanation, breaking the learning flow. Instead: real responsive collapse for tablet (≥768px), elegant gate overlay for phone (<768px) with `/about` polish so phone visitors get a meaningful entry point.
>
> **Split into two sessions:**
> - **T17a** — Tablet responsive (768–1023px collapse to single-column functional layout).
> - **T17b** — Phone gate (<768px) + `/about` mobile polish + Share-link prominence on gate.
>
> Each task is single-session sized per the project's "one task per session" directive.

---

#### ~~T17a — Tablet responsive collapse~~ · **DONE 2026-05-14** — see handoff "What Was Done (Task 17a)"

- **Problem:** `MemoryWorkspace` 3-column grid (sidebar 220px / canvas / panel 340px) needs ~560px of fixed content width. At 768–1023px (iPad portrait, small laptops, split-screen) the layout overflows or feels cramped.
- **Goal:** at 768–1023px, app stays fully usable in a single-column stack — sidebar collapses to a drawer or chip strip, canvas takes full width, explanation panel docks below.
- **Files likely affected:**
  - `app/globals.css` — `@media (min-width: 768px) and (max-width: 1023px)` block; restructure `.memory-workspace__main` grid to single column; sidebar → drawer (slide-in from left, triggered by hamburger in navbar) OR chip strip above canvas; `.memory-workspace__panel` stacks below canvas-area; navbar slots reflow.
  - `components/memory/MemoryWorkspace.tsx` — if drawer chosen, add `isSidebarOpen` state + hamburger toggle button; possibly close on scenario select.
  - `components/memory/MemorySidebar.tsx` — drawer styling variant (or no change if pure CSS).
  - `components/memory/MemoryControls.tsx` — verify progressbar wrap still flexes; speed selector + step counter may need to wrap on tablet.
- **Decision to make at start:** drawer vs chip strip. Drawer = closer to mobile-app paradigm, hides scenario list until needed. Chip strip = scenarios always visible, no toggle. Pick whichever survives the category grouping (Fundamentals / Data Structures / Bugs & Pitfalls) cleanly — confirm with user if non-obvious.
- **Acceptance criteria:**
  - At 768×1024 (iPad portrait): no horizontal scroll. Canvas full-width readable. Sidebar reachable in ≤1 tap. Explanation panel stacks below canvas, tabs work, Variables visible.
  - At 1024px+: desktop layout unchanged (same 3-column grid, no regressions).
  - At <768px: no behavior change in this session (T17b handles it; phone may still be broken — note it in handoff).
  - Welcome overlay still works at 768px.
  - Welcome overlay split-wipe animation still functions at 768px.
  - `pnpm test` 48 green. `pnpm build` clean.
  - Puppeteer screenshots at 768 / 1024 / 1280 saved in `tmp-screenshots/`.
  - Deploy to Vercel production.

---

#### ~~T17b — Phone gate + `/about` mobile polish~~ · **DONE 2026-05-14** — see handoff "What Was Done (Task 17b)"

- **Problem:** at <768px the app cannot meaningfully render scenarios. Need an intentional gate that signals design judgment (not broken layout) + a functional alternative entry point.
- **Goal:**
  - **Gate overlay** at `<768px` on `/` (memory workspace): branded fullscreen card with VisualizeIT logo, headline like "Stack frames + pointers need room", subtext "Open on laptop or tablet ≥768px to step through C memory", a "Copy Link" button (reuse Share clipboard logic), a secondary link to `/about` ("Read the overview"), small note that the current URL preserves `?scenario=&step=` for the desktop session.
  - **`/about` page**: make it fully responsive at all widths including 375px (it's currently desktop-only too — verify and fix).
- **Files likely affected:**
  - `components/memory/MemoryWorkspace.tsx` — render `<PhoneGate />` when `matchMedia("(max-width: 767px)").matches`. Use `useEffect` to set up listener (and avoid SSR hydration mismatch — initialize from `useState` lazy with browser check, or render gate only after mount). Reuse Share clipboard logic.
  - `components/memory/PhoneGate.tsx` — **new file**. Self-contained: logo (reuse SVG from welcome overlay), copy, Copy Link button with "Copied!" feedback, About link.
  - `app/globals.css` — `.phone-gate` styles (fixed inset, dot-grid bg matching welcome overlay, centered card, responsive copy sizes).
  - `app/about/page.tsx` — audit for fixed widths, add media queries; current `max-width: 760px` centered layout should already mostly work, but verify category badges, hero, footer CTA at 375px.
- **Acceptance criteria:**
  - At 375×667: `/` shows gate, no broken workspace behind. Tap "Copy Link" → clipboard has full URL incl. params + "Copied!" feedback 1.5s. Tap "Read the overview" → navigates to `/about`. No horizontal scroll. Logo + copy legible.
  - At 414×896 (iPhone 14 Pro Max): same gate, comfortable spacing.
  - At 767×1024 edge: gate still shows (since <768px).
  - At 768×1024: gate gone, T17a tablet layout shows.
  - `/about` at 375px: no horizontal scroll, scenario list cards readable, hero hierarchy preserved, footer CTA tappable.
  - `pnpm test` 48 green. `pnpm build` clean.
  - Puppeteer screenshots at 375 / 414 / 767 / 768 saved in `tmp-screenshots/`.
  - Deploy to Vercel production.

---

### ~~T-UX-1 — Fullscreen canvas mode~~ · **DONE 2026-05-14**

- Focus button in navbar, `f` key toggles, `Esc` restores. Sidebar + panel hidden via `.is-fullscreen` CSS class on `.memory-workspace__main`. Works at ≥768px, tablet drawer unaffected.

### T-UX-2 — Canvas zoom in/out · **P1**

- **Problem:** Dense scenes (linked-list, recursive-stack peak) are hard to read at low container widths.
- **Files likely affected:** `MemoryCanvas.tsx` (zoom state, wheel handler with `event.ctrlKey` or button-driven; multiply into existing transform), `MemoryWorkspace.tsx` (zoom buttons).
- **Acceptance criteria:** `+` / `−` buttons or `Ctrl+wheel` adjust zoom 0.5×–2×. Hit-test still correct at any zoom (CSS-width / bounds-width ratio already handles this — verify). Reset button or double-click resets to 1×.

### T-UX-3 — Animated step transitions (morph) · **P1**

- **Problem:** Stepping between snapshots is a hard cut. Frames jump. Pointers re-draw. Users lose continuity.
- **Files likely affected:** `MemoryCanvas.tsx` — interpolate element positions between previous and current scene over ~200–300ms; tween only `transform` + `opacity`. Use `requestAnimationFrame` driven by a `transitionProgress` value.
- **Acceptance criteria:** Step forward: existing elements lerp from old position to new. New elements fade in. Removed elements fade out. No jank at 60fps. Disabled when user holds Shift (instant). Respects `prefers-reduced-motion`.

### T-UX-4 — Scenario completion checkmark · **P2**

- **Problem:** Sidebar gives no feedback when a user finishes a scenario.
- **Files likely affected:** `MemoryWorkspace.tsx` (track `completedScenarios: Set<string>` in `localStorage`, mark on reaching `maxStep`), `MemorySidebar.tsx` (render ✓ next to label).
- **Acceptance criteria:** Reaching the final step of any scenario adds it to localStorage. Sidebar renders a small checkmark next to completed scenarios. Persists across reloads. Clear button optional (P3).

### T-UX-5 — Hover tooltips on canvas elements · **P2**

> Previously planned as Task 17 but deprioritized — mobile-responsive is more urgent.

- **Problem:** Canvas is passive — no way to inspect an element without context-clicking.
- **Files likely affected:** `MemoryCanvas.tsx` — `hoveredId` state separate from `selectedId`; `mousemove` runs existing hit-test; tooltip is absolutely positioned div in `.memory-canvas-shell`.
- **Tooltip contents:** name, type, current value (if any), simulated memory address (deterministic hash of element id → hex like `0x7ffd2a3c`).
- **Acceptance criteria:** Hover stack var → tooltip w/ name/type/value/address. Hover heap block → label/size hint/address. Hover empty canvas → no tooltip. Mouse leave clears. Same id → same address (stable across steps). Pointer-events: none on tooltip. Fade 100ms.

---

## Content (more scenarios)

> All new scenarios go in `features/memory-engine/simulation/fixtures.ts` with `codeLines` + `stepToLine`. Update `memoryEngine.test.ts` count assertion + add a scenario-specific test. Sidebar category groups already render counts automatically.

### ~~T-CONTENT-1 — Buffer overflow / stack corruption~~ · **DONE 2026-05-14**

- `buffer-overflow` scenario added. `BUFFER_OVERFLOW` diagnostic type added to engine. `capacity` field on `HeapBlock` tracks initial field count; `WRITE_FIELD` emits overflow when index ≥ capacity. Explanation panel shows "Buffer overflow — write past the end of a fixed-size buffer corrupts adjacent memory." 49 tests green.

### T-CONTENT-2 — Arrays on stack (`int arr[5]`) · **P1**

- **Concept:** Stack-allocated fixed array, contrast with heap array from `pointer-arithmetic`.
- **Engine consideration:** Treat as a stack variable with N slots; reuse `WRITE_FIELD` against a stack target instead of a heap target. May require extending `target.kind` to `"stackArrayIndex"` — check existing types in `simulation/types.ts`.
- **Category:** Fundamentals.

### T-CONTENT-3 — Double pointer (`**ptr`) · **P1**

- **Concept:** Pointer to pointer. Common in linked-list head-mutation, swap-by-reference, dynamic 2D arrays.
- **Engine consideration:** `ASSIGN_POINTER` chain: `pp` points to `p` (stack address), `p` points to heap block. Need pointer-to-stack-variable as a valid pointer target — confirm in `types.ts`.
- **Category:** Fundamentals.

### T-CONTENT-4 — Static variables (persist between calls) · **P2**

- **Concept:** `static int count = 0;` — survives function exit, lives in `.data` or `.bss`.
- **Engine consideration:** Needs a new memory region beyond stack/heap (e.g. `staticArea`). Snapshot type extension + new render lane in `MemoryCanvas`. Bigger lift than other content tasks.
- **Category:** Fundamentals.

### T-CONTENT-5 — Circular linked list · **P2**

- **Concept:** Tail's `next` points back to head. Visualizes pointer cycles, traversal hazards.
- **Engine consideration:** Pure data — reuse existing pointer machinery from `linked-list-traversal`. Diagnostic for "cycle detected" optional.
- **Category:** Data Structures.

### T-CONTENT-6 — Binary tree traversal · **P2**

- **Concept:** Recursive in-order or pre-order walk on a 3–5 node tree.
- **Engine consideration:** Each node has `left` and `right` pointers. Layout in `layoutMemoryScene` may need a tree-aware arrangement (current heap layout is linear). Big visual lift.
- **Category:** Data Structures.

### T-CONTENT-7 — String on stack vs string literal · **P2**

- **Concept:** `char s[] = "hi"` (copy on stack, writable) vs `char *s = "hi"` (pointer to read-only `.rodata`). Writing through the literal pointer = UB.
- **Engine consideration:** Needs read-only string region (similar to static area). Diagnostic `WRITE_TO_RODATA` on illegal mutation.
- **Category:** Fundamentals.

---

## Educational

### T-EDU-1 — Embed mode (`?embed=1`) · **P1**

- **Problem:** Teachers / bloggers want to drop a single scenario into an article without the sidebar + navbar chrome.
- **Files likely affected:** `MemoryWorkspace.tsx` — read `embed` param from `useSearchParams`; when `embed=1`, render canvas + step controls only (no sidebar, no navbar, no explanation panel — or panel collapsed). `app/page.tsx` no change.
- **Acceptance criteria:** `/?scenario=recursive-stack&step=3&embed=1` renders a minimal canvas-focused view. Iframe-friendly (no top-level navigation). Tested at 800×500 (typical blog embed). Original URL params still work.

### T-EDU-2 — Export current step as PNG · **P2**

- **Problem:** Users want to drop a screenshot into notes / slides without OS screenshot tooling.
- **Files likely affected:** `MemoryCanvas.tsx` — expose `canvasRef.toDataURL("image/png")` via a download button. Wire button in `MemoryWorkspace.tsx` near the Share button.
- **Acceptance criteria:** Button labeled "Export PNG" → downloads `visualizeit-<scenario>-step<N>.png`. Image matches what's currently on canvas. Includes step banner text (composite onto a wrapping canvas if needed).

---

## Technical

### T-TECH-1 — OpenGraph meta tags · **P1**

- **Problem:** Sharing the URL in Slack / Twitter / WhatsApp shows no preview.
- **Files likely affected:** `app/layout.tsx` (metadata export) + new `app/opengraph-image.tsx` (Next.js dynamic OG image with the welcome card visual) + `app/twitter-image.tsx`. Optional per-scenario OG via `app/page.tsx` dynamic metadata.
- **Acceptance criteria:** Link preview shows title, description, image. Validated with https://www.opengraph.xyz/ or Twitter card validator. Image generated at build time, not runtime.

### T-TECH-2 — SEO: dynamic metadata per scenario · **P2**

- **Problem:** `/?scenario=recursive-stack` has the same `<title>` as the root. Search engines see one page.
- **Files likely affected:** `app/page.tsx` — `generateMetadata({ searchParams })`; derive title from scenario label. Sitemap optional (`app/sitemap.ts`).
- **Acceptance criteria:** Each scenario URL has unique `<title>`, `<meta description>`. View-source confirms. Sitemap lists all 8 scenarios.

### T-TECH-3 — Phase 3 WASM acceleration · **P3** · long horizon

- **Status:** Phase 3 per `docs/mvp/02-memory-engine-roadmap.md`. Not started.
- **Scope (per ADR-001):** C/C++ memory model prototype compiled to WASM, TypeScript adapter, behavior parity tests vs current TS reference. Web Worker hosts WASM calls; snapshots cross the boundary, not React state.
- **Prerequisites:** All current scenarios stable in TS. Snapshot schema frozen. Performance profiling done first — only justify WASM if current TS simulation actually becomes a bottleneck (it isn't today).
- **Not for a single session.** Treat as its own multi-task phase.

---

## Done (chronological)

> See `docs/handoffs/2026-05-12-phase-2-recursive-stack-context.md` for full task notes.

- T1–T8: Recursive-stack scenario + pedagogy + 7 scenarios w/ real C code + diagnostic-aware explanations.
- T9: ResizeObserver replacing `fitRatio` hack.
- T10: Deploy to Vercel.
- T11: Static `/about` page.
- T12: Welcome overlay (inline canvas).
- T13: Keyboard shortcuts (Space/Arrows).
- T14: Shareable URL state (`?scenario=&step=`).
- T15: Share button (clipboard + "Copied!" feedback).
- T16: Step-progress dot row (later removed in `9ca932f` — navbar progress fill is the indicator).
- T17a: Tablet responsive collapse (768–1023px drawer + single-column).
- T17b: Phone gate (<768px) + `/about` mobile audit.
- T-UX-1: Fullscreen canvas mode (`f` / Esc, navbar focus button).
- T-CONTENT-1: `buffer-overflow` scenario + `BUFFER_OVERFLOW` diagnostic (`HeapBlock.capacity`, 49 tests).
