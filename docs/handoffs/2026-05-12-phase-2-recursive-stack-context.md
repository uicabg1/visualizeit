# Handoff — Recursive Stack: Tasks 1 & 2 Done / Task 3

**Date:** 2026-05-13
**Status:** Tasks 1–16 complete. Task 17 (mobile responsive) pending.

> **Backlog & future tasks:** See [docs/roadmap/backlog.md](../roadmap/backlog.md). All upcoming work (UX, content, educational, technical) is enumerated there with priorities and acceptance criteria. Read both this handoff (last session outcome) and the backlog (forward queue) before starting a session.

---

## What Was Done (Task 1)

Added `recursive-stack` scenario to the memory engine simulation.

**Files changed:**
- `features/memory-engine/simulation/fixtures.ts` — appended 5th scenario with 11-command `factorial(3)` call chain
- `features/memory-engine/simulation/memoryEngine.test.ts` — updated scenario count assertion to 5, added `recursive-stack` specific test

**Verification passed:**
- `pnpm test` → 38 tests green
- `pnpm lint` → zero errors in changed files (pre-existing errors in unrelated files only)
- `pnpm build` → clean, route `/` stays at 11.3 kB

**Engine behavior confirmed:** `DECLARE_VARIABLE` pushes into the active top frame only. Variable IDs are `frame-N-n`, so three frames each declaring `n = 3`, `n = 2`, `n = 1` produce distinct variables with no collision.

**Peak frame count:** 4 (main + factorial×3)
**Final frame count:** 0 (all unwound)
**Diagnostics at end:** none

---

## Current State of Scenario

```
Step 0  — initial state (empty)
Step 1  — ENTER_FUNCTION main           → 1 frame
Step 2  — ENTER_FUNCTION factorial      → 2 frames (n=3)
Step 3  — DECLARE_VARIABLE n=3
Step 4  — ENTER_FUNCTION factorial      → 3 frames (n=2)
Step 5  — DECLARE_VARIABLE n=2
Step 6  — ENTER_FUNCTION factorial      → 4 frames (n=1, base case) ← peak
Step 7  — DECLARE_VARIABLE n=1
Step 8  — EXIT_FUNCTION                 → 3 frames (returns 1)
Step 9  — EXIT_FUNCTION                 → 2 frames (returns 2)
Step 10 — EXIT_FUNCTION                 → 1 frame  (returns 6)
Step 11 — EXIT_FUNCTION main            → 0 frames
```

---

## What Was Done (Task 2)

UI verification pass for the `recursive-stack` scenario.

**Tool used:** Puppeteer (installed as dev dep) with system Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

**Bug found and fixed:**
Variable values (`3`, `2`, `1`) were not visible in stack frames. Root cause: the scene layout computes `effectiveStackWidth = minWidth - 2 * stackX = 960 - 96 = 864px` for stack-only scenarios, placing variable value text at canvas x≈888. The canvas shell container is ~879px wide at 1440px viewport, clipping the rightmost ~81px.

**Fix — `components/memory/MemoryCanvas.tsx`:**
Added `fitRatio = min(1, containerWidth / scene.bounds.width)` to the `paint` function. When the container is narrower than the scene, the canvas and its transform scale proportionally so all content fits. Hit-testing is unaffected (it already uses `bounds.width / CSS width` ratio dynamically).

**Verification passed:**
- Peak screenshot (step 7): 4 distinct frames — `main()` empty + 3 `factorial()` each showing correct `n` value (3, 2, 1) ✅
- Final screenshot (step 11): 0 active frames, ghost `main()` frame with dashed border + "released" label ✅
- 4 other scenarios at step 1: no regressions ✅
- No console errors ✅
- `pnpm test` → 38 tests green ✅

**Screenshots saved to `tmp-screenshots/`:**
- `recursive-stack-peak.png`
- `recursive-stack-final.png`
- `spot-stack-frames-step1.png`
- `spot-heap-blocks-step1.png`
- `spot-struct-with-pointer-step1.png`
- `spot-leak-and-dangling-pointer-step1.png`

---

## What Was Done (Task 3)

Added recursive-aware explanations to `features/memory-engine/pedagogy/explainEvent.ts`.

**Logic added:**

- `ENTER_FUNCTION`: if `command.functionName` already appears more than once in `snapshot.stackFrames` (recursive call detected), append `"Recursive call — call stack is now N frames deep."` If `snapshot.event.label` contains `"base case"`, also append `"Base case reached — no further recursion."`
- `EXIT_FUNCTION`: if `snapshot.event.label` matches `/returns (\S+)/`, append `"Returns [val] — this frame is unwound from the call stack."`

**3 new unit tests added** to `features/memory-engine/pedagogy/explainEvent.test.ts`:
- Recursive `ENTER_FUNCTION` depth language
- Base case label triggers additional explanation
- `EXIT_FUNCTION` return value extraction from label

**Verification passed:**
- `pnpm test` → 41 tests green (was 38)
- Step 6 (ENTER_FUNCTION base case): 3 explanation lines visible — generic push + recursive depth + base case ✅
- Step 8 (EXIT_FUNCTION returns 1): "Returns 1 — this frame is unwound from the call stack." ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `recursive-stack-explanation-step6-basecase.png`
- `recursive-stack-explanation-peak.png`
- `recursive-stack-explanation-step8-exit.png`
- `recursive-stack-explanation-final.png`

**Known architectural note (unchanged):** The canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 4)

Replaced command-list Code tab with real C source code + per-step line highlighting.

**Files changed:**
- `features/memory-engine/simulation/fixtures.ts` — added optional `codeLines?: string[]` and `stepToLine?: number[]` to `MemoryScenario` type; added C code and mappings to `stack-frame-basics` and `recursive-stack`.
- `components/memory/ExplanationPanel.tsx` — added `codeLines?` and `highlightedLine?` props; renders `<pre>` with per-line `<span>` and `.is-active` on the highlighted line; falls back to `<ol>` command list when `codeLines` absent.
- `components/memory/MemoryWorkspace.tsx` — computes `activeCommandIndex = activeStepIndex - 1` and `highlightedLine = stepToLine[activeCommandIndex]`; passes both down to `ExplanationPanel`.
- `app/globals.css` — added `.code-block` and `.code-block__line` styles (monospace, dark bg, `.is-active` blue accent matching existing `.code-steps` pattern).

**Design decisions:**
- Step 0 (no active command): no line highlighted — `highlightedLine` is `undefined`.
- `ExplanationPanel` receives pre-resolved `codeLines?` + `highlightedLine?` — no business logic inside the UI component.
- Lines rendered as `<span>` blocks with CSS counter for line numbers; `.is-active` reuses existing color tokens (`--color-pointer`, `rgba(63, 167, 255, 0.07)`).

**C code and stepToLine mappings:**

`stack-frame-basics` — `stepToLine: [0, 1, 3]`
```c
int main() {          // line 0
    int counter = 42; // line 1
    return 0;         // line 2
}                     // line 3
```

`recursive-stack` — `stepToLine: [5, 0, 0, 2, 0, 1, 0, 1, 2, 2, 7]`
```c
int factorial(int n) {          // line 0
    if (n <= 1) return 1;       // line 1
    return n * factorial(n - 1);// line 2
}                               // line 3
                                // line 4
int main() {                    // line 5
    factorial(3);               // line 6
}                               // line 7
```

**Verification passed:**
- `pnpm test` → 41 tests green (no engine changes)
- `pnpm build` → clean, route `/` at 11.7 kB
- `recursive-stack` step 7/12 (base case): `if (n <= 1) return 1;` highlighted ✅
- `recursive-stack` step 9/12 (EXIT returns 1): same line highlighted, ghost frame visible ✅
- `stack-frame-basics` step 3/4: `int counter = 42;` highlighted ✅
- `heap-allocation` (no `codeLines`): falls back to command list, no regression ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task4-code-step6-basecase.png`
- `task4-code-step8-exit.png`
- `task4-sfb-step2-declare.png`
- `task4-heap-fallback.png`

**Known architectural note (unchanged):** Canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 5)

Added `codeLines` + `stepToLine` to the three remaining scenarios: `heap-allocation`, `struct-with-pointer`, `leak-and-dangling-pointer`.

**Files changed:**
- `features/memory-engine/simulation/fixtures.ts` — added `codeLines` and `stepToLine` to all three scenarios.

**C code and stepToLine mappings:**

`heap-allocation` — `stepToLine: [0, 1, 2, 3, 4]`
```c
int main() {          // line 0
    int *p;           // line 1
    p = malloc(4);    // line 2
    *p = 7;           // line 3
    free(p);          // line 4
}                     // line 5
```

`struct-with-pointer` — `stepToLine: [4, 5, 6, 7, 8, 9]`
```c
struct Node {                           // line 0
    int value; struct Node *next;       // line 1
};                                      // line 2
                                        // line 3
int main() {                            // line 4
    struct Node *node;                  // line 5
    struct Node *next;                  // line 6
    node = malloc(sizeof(struct Node)); // line 7
    next = malloc(sizeof(struct Node)); // line 8
    node->next = next;                  // line 9
}                                       // line 10
```

`leak-and-dangling-pointer` — `stepToLine: [0, 1, 2, 3, 4, 5, 6, 7, 8]`
```c
int main() {               // line 0
    int *leaked;           // line 1
    int *dangling;         // line 2
    leaked = malloc(4);    // line 3
    dangling = malloc(4);  // line 4
    leaked = NULL;         // line 5
    free(dangling);        // line 6
    *dangling;             // line 7
    free(dangling);        // line 8
}                          // line 9
```

**Verification passed:**
- `pnpm test` → 41 tests green (no engine changes) ✅
- `heap-allocation` step 3 (malloc): `p = malloc(4);` highlighted ✅
- `struct-with-pointer` step 6 (assign pointer): `node->next = next;` highlighted ✅
- `leak-and-dangling-pointer` step 8 (dangling read): `*dangling;` highlighted ✅
- No console errors ✅
- All 5 scenarios confirmed to show real C code (no fallback to command list) ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task5-heap-malloc-step3.png`
- `task5-struct-assign-step6.png`
- `task5-leak-dangling-read-step8.png`

**Known architectural note (unchanged):** Canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 6)

Added `pointer-arithmetic` scenario — 6th scenario, under Fundamentals category.

**Files changed:**
- `features/memory-engine/simulation/fixtures.ts` — added `pointer-arithmetic` scenario with 11 commands (ENTER_FUNCTION, DECLARE_VARIABLE arr, MALLOC int[3], 3× WRITE_FIELD, DECLARE_VARIABLE ptr, ASSIGN_POINTER, READ_VALUE, FREE, EXIT_FUNCTION), `codeLines`, and `stepToLine`
- `features/memory-engine/simulation/memoryEngine.test.ts` — updated count assertion to 6, added `pointer-arithmetic` test verifying 3 field values after writes + freed at end

**Note on command count:** The task spec said 10 commands, but MALLOC requires a prior DECLARE_VARIABLE for `arr`, making it 11. `stepToLine` length = 11.

**C code:**
```c
int main() {
    int *arr;
    arr = malloc(12);
    arr[0] = 10;
    arr[1] = 20;
    arr[2] = 30;
    int *ptr = arr;
    ptr = arr + 1;
    *ptr;
    free(arr);
}
```

**Engine note:** `ASSIGN_POINTER` with `source: { kind: "heapBlock", blockId: "heap-1" }` represents `ptr = arr + 1` — the engine has no index-offset concept so both `arr` and `ptr` point to the same block; the label carries the conceptual distinction.

**Verification passed:**
- `pnpm test` → 42 tests green (was 41) ✅
- Step 6 (WRITE arr[1]=20): `arr[1] = 20;` highlighted, heap block shows [0]=10, [1]=20, [2]=0 ✅
- Step 8 (DECLARE ptr): `int *ptr = arr;` highlighted, both `arr` and `ptr` shown in stack with pointer to heap block, all 3 fields written ✅
- 6 scenarios in sidebar under "6 algorithms · by visualizeit" ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task6-pointer-arith-step5-writes.png`
- `task6-pointer-arith-step7-ptr-advance.png`

**Known architectural note (unchanged):** Canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 7)

Updated diagnostic-aware explanations in `features/memory-engine/pedagogy/explainEvent.ts` to use standardized hint text.

**Files changed:**
- `features/memory-engine/pedagogy/explainEvent.ts` — replaced 5 diagnostic message strings with the standardized `"[Type] — [explanation]"` format:
  - `MEMORY_LEAK` → `"Memory leak — this block has no live pointer references and cannot be freed."`
  - `DANGLING_POINTER` → `"Dangling pointer — ${targetLabel ?? "a pointer"} points to memory that was already freed."`
  - `DOUBLE_FREE` → `"Double free — freeing the same block twice is undefined behavior."`
  - `NULL_POINTER_DEREFERENCE` → `"Null dereference — reading or writing through a null pointer crashes the program."`
  - `USE_AFTER_FREE` → `"Use after free — accessing freed memory is undefined behavior."`
- `features/memory-engine/pedagogy/explainEvent.test.ts` — updated existing `"explains memory diagnostics"` test to match new text; added 5 new dedicated unit tests (one per diagnostic type).

**Note:** The diagnostic loop already existed from a prior session — this task standardized the message text and added proper coverage.

**Verification passed:**
- `pnpm test` → 47 tests green (was 42) ✅
- Step 6 (`leaked = NULL`): `"Memory leak — this block has no live pointer references and cannot be freed."` visible ✅
- Step 8 (`*dangling`): `"Use after free — accessing freed memory is undefined behavior."` + `"Dangling pointer — dangling points to memory that was already freed."` visible ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task7-step6-memory-leak.png`
- `task7-step8-use-after-free.png`

**Known architectural note (unchanged):** Canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 8)

Added `linked-list-traversal` scenario — 7th scenario, under Data Structures category.

**Files changed:**
- `features/memory-engine/simulation/fixtures.ts` — appended `linked-list-traversal` scenario with 13 commands (ENTER_FUNCTION, 2× DECLARE_VARIABLE, 2× MALLOC, ASSIGN_POINTER head->next=curr, ASSIGN_POINTER curr=head, READ_VALUE, ASSIGN_POINTER curr=curr->next, READ_VALUE, FREE curr, FREE head, EXIT_FUNCTION), `codeLines`, and `stepToLine`
- `features/memory-engine/simulation/memoryEngine.test.ts` — updated count assertion to 7; added `linked-list-traversal` test verifying heap-1 value=1, heap-2 value=2, head->next pointer chain to heap-2, and both blocks freed at end

**Note on step 6 command type:** The task spec said `WRITE_FIELD head->next = curr` but the engine uses `ASSIGN_POINTER` for pointer-field writes (consistent with `struct-with-pointer`). Used `ASSIGN_POINTER` with `target: { kind: "heapField", blockId: "heap-1", fieldName: "next" }`.

**C code and stepToLine mapping:**
```c
struct Node {         // line 0
    int value;        // line 1
    struct Node *next;// line 2
};                    // line 3
                      // line 4
int main() {          // line 5
    struct Node *head; // line 6
    struct Node *curr; // line 7
    head = malloc(sizeof(struct Node)); // line 8
    curr = malloc(sizeof(struct Node)); // line 9
    head->next = curr; // line 10
    curr = head;       // line 11
    head->value;       // line 12
    curr = curr->next; // line 13
    curr->value;       // line 14
    free(curr);        // line 15
    free(head);        // line 16
}                      // line 17
```
`stepToLine: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]`

**Verification passed:**
- `pnpm test` → 48 tests green (was 47) ✅
- Step 6 (ASSIGN_POINTER head->next = curr): pointer arrow from heap-1 `next` field to heap-2 ✅
- Step 9 (ASSIGN_POINTER curr = curr->next): `curr` stack variable points to second node (heap-2) ✅
- Step 14 (EXIT main): both nodes freed with "freed" markers, ghost frame visible ✅
- No console errors ✅
- Sidebar shows 7 algorithms, Data Structures group shows "2" (Struct With Pointer + Linked List Traversal) ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task8-linked-list-step6-head-next.png`
- `task8-linked-list-step9-curr-advance.png`
- `task8-linked-list-final.png`

**Known architectural note (unchanged):** Canvas scene layout uses fixed `minWidth: 960`. The `fitRatio` fix in `MemoryCanvas.tsx` compensates at render time. Proper fix: pass container width as `minWidth` to `layoutMemoryScene` via `ResizeObserver` in `MemoryWorkspace.tsx`. Not urgent.

---

## What Was Done (Task 9)

Fixed canvas layout architecture — replaced `fitRatio` render-time scale hack with a `ResizeObserver` that feeds real container width into `layoutMemoryScene`.

**Files changed:**
- `components/memory/MemoryWorkspace.tsx` — added `containerWidth` state (default 960), `canvasAreaRef` ref on `.memory-workspace__canvas-area`, `useEffect` with `ResizeObserver` that updates `containerWidth` on resize, passed `minWidth: containerWidth` to `layoutMemoryScene`, added `containerWidth` to `activeScene` memo deps.
- `components/memory/MemoryCanvas.tsx` — removed `fitRatio` calculation (3 lines), simplified `paint` to use `targetScene.bounds.width` directly, simplified `setTransform` to `scale` only (no `fitRatio` multiplier). Hit-test logic unchanged — still uses `bounds.width / CSS width` ratio dynamically.

**Architecture before → after:**
- Before: `layoutMemoryScene` fixed at `minWidth: 960`; `MemoryCanvas` applied `fitRatio = min(1, containerWidth / 960)` CSS scale at paint time; only fired on mount.
- After: `ResizeObserver` feeds real container width into `layoutMemoryScene` as `minWidth`; scene is sized correctly before paint; `fitRatio` eliminated; resize-responsive.

**Verification passed:**
- `pnpm test` → 48 tests green (no regressions) ✅
- At 1024px: canvas=463px, container=464px — no overflow ✅
- At 1280px: canvas=719px, container=720px — no overflow ✅
- At 1440px: canvas=879px, container=880px — no overflow ✅
- `recursive-stack` peak (step 8): 4 frames with n=3/2/1 visible at all widths ✅
- `linked-list-traversal` step 6: pointer arrow heap-1→heap-2 correct at all widths ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task9-recursive-peak-1024.png`
- `task9-recursive-peak-1280.png`
- `task9-recursive-peak-1440.png`
- `task9-linked-list-step6-1024.png`
- `task9-linked-list-step6-1280.png`
- `task9-linked-list-step6-1440.png`

---

## What Was Done (Task 10)

Deployed VisualizeIT to Vercel production.

**Steps executed:**
1. `pnpm build` → clean (route `/` at 12.6 kB, no type errors)
2. Installed Vercel CLI globally (`npm install -g vercel`)
3. CLI was already authenticated as `uicabgadiel67-1227`
4. Linked project to team `uicabgadiel67-1227s-projects` via `vercel link --yes` — created `.vercel/project.json` (projectId `prj_4nAKDWjisX9roVHDKOkCQFGyN2ja`)
5. Deployed with `vercel deploy --prod -y --no-wait`
6. Polled until status `● Ready`
7. Updated `README.md` — added `**[Live Demo →](https://visualizeit-uicabgadiel67-1227s-projects.vercel.app)**` at top

**Production URL:** https://visualizeit-uicabgadiel67-1227s-projects.vercel.app

**Note on GitHub integration:** `vercel link --repo` failed (no Login Connection to GitHub in the Vercel account). Project is linked via `.vercel/project.json` and deploys via CLI. To enable git-push auto-deploys: visit the Vercel dashboard → project settings → connect GitHub repo `uicabg1/visualizeit`.

**Verification passed:**
- `pnpm build` clean ✅
- Deployment status `● Ready` ✅
- README updated with live demo link ✅
- 48 tests green (no regressions — no code changes) ✅

---

## What Was Done (Task 11)

Added static `/about` page and navbar link to VisualizeIT.

**Files changed:**
- `app/about/page.tsx` — new static Next.js page (no client components); includes hero with Syne display headline + 2-paragraph description, full 7-scenario list with category badges (amber/teal/error), "Open the visualizer →" footer CTA; all styles inline via `<style>` tag using existing CSS tokens from `globals.css`
- `components/memory/MemoryWorkspace.tsx` — added `next/link` import; added "About" link in the right slot of the `1fr auto 1fr` navbar grid (justified end), styled with `--text-secondary` + `--border-default`

**Design decisions:**
- About page uses `max-width: 760px` centered layout — intentionally narrower than the app for readability
- Category badges reuse existing token classes: `--accent-amber-dim/border` (Fundamentals), `--color-pointer-dim` (Data Structures), `--color-error-dim` (Bugs & Pitfalls)
- Left-border accent on scenario cards matches the existing `.plain-list li` pattern (3px colored left border)
- No new global CSS added — all page styles scoped inline in the component

**Verification passed:**
- `pnpm test` → 48 tests green (no regressions) ✅
- `pnpm build` → clean; `/about` route at 162 B ✅
- Deployed to Vercel production ✅

**Production URL:** https://visualizeit-uicabgadiel67-1227s-projects.vercel.app/about

---

## What Was Done (Task 12)

Added welcome empty-state overlay to the canvas area for first load.

**Files changed:**
- `components/memory/MemoryCanvas.tsx` — added `showOverlay = (stepIndex ?? 0) === 0` guard; when true, renders an absolutely-positioned `.memory-canvas-overlay` div inside `.memory-canvas-shell` with the VisualizeIT logo SVG (40×40), headline "Step through C memory, live.", hint text, and two keyboard chips `[Space] Play` / `[→] Next step`; uses `aria-hidden="true"` since it's decorative guidance
- `app/globals.css` — added `.memory-canvas-overlay`, `@keyframes overlay-fade-in` (fade + 10px upward slide, 0.5s ease), `.memory-canvas-overlay__headline` (display font, 22px, −0.03em tracking), `.memory-canvas-overlay__hint`, `.memory-canvas-overlay__chips`, `.memory-canvas-overlay__chip`, `.memory-canvas-overlay__chip kbd` — all using existing tokens; `pointer-events: none` so overlay never blocks canvas interaction

**Verification passed:**
- `pnpm test` → 48 tests green (no changes to engine) ✅
- `pnpm build` → clean; route `/` at 12.9 kB ✅
- Step 0: overlay visible with logo, headline, hint, and keyboard chips ✅
- Step 1 (after clicking Step forward): overlay gone, `main()` frame rendered correctly ✅
- No console errors ✅

**Deployed to production:** https://visualizeit-uicabgadiel67-1227s-projects.vercel.app

**Screenshots saved to `tmp-screenshots/`:**
- `task12-overlay-step0.png`
- `task12-after-next.png`

---

## What Was Done (Task 13)

Added keyboard shortcut support to `MemoryWorkspace.tsx`.

**Files changed:**
- `components/memory/MemoryWorkspace.tsx` — added `useEffect` with `window` `keydown` listener; maps Space → toggle play/pause (`setIsPlaying(c => !c)`), ArrowRight → `setStepIndex(c => clampStep(c + 1, maxStep))`, ArrowLeft → `setStepIndex(c => clampStep(c - 1, maxStep))`; `preventDefault()` on all three keys; skips when `target.tagName` is `INPUT`/`TEXTAREA` or `target.isContentEditable`; removes listener on cleanup; deps `[maxStep]`.

**Design decisions:**
- Used functional `setStepIndex` updater form — no dependency on `activeStepIndex`, only `maxStep` needed.
- `target.isContentEditable` catches all `[contenteditable]` elements including nested ones.

**Verification passed:**
- `pnpm test` → 48 tests green ✅
- `pnpm build` → clean; route `/` at 13 kB ✅
- ArrowRight: step 1/4 → 2/4 ✅
- ArrowLeft: step 2/4 → 1/4 ✅
- Space play: step advanced after ~1.2s ✅
- Space pause: step frozen for 0.8s after second press ✅
- Deployed to Vercel production ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task13-keyboard-shortcuts.png`

---

## Design Spec — Welcome Overlay Redesign (Session Enhancement)

**Goal:** Replace the inline canvas overlay with a fullscreen title card that splits apart (top half up, bottom half down) when the user first advances past step 0.

**Visual design:**
- `position: fixed; inset: 0; z-index: 50` — covers navbar, sidebar, everything
- Background: `var(--bg-base)` + dot-grid + amber radial glow at ~35% vertical (above center, where logo sits) + violet depth glow
- Logo SVG 60×60 with amber drop-shadow filter
- Headline Syne: line 1 `"Step through"` in `--text-secondary`; line 2 `"C memory, live."` in `--text-primary` with `C` in `--accent-amber`
- Font size `clamp(40px, 6vw, 80px)`, `letter-spacing: -0.04em`
- Sub-label: `"7 scenarios · Stack · Heap · Pointers"` in `--text-muted`, uppercase, spaced
- Keyboard chips (same tokens as before, slightly larger)
- Entry: per-item stagger `overlay-item-in` (translateY 18px → 0, opacity 0→1), delays 0.05/0.15/0.25/0.38/0.48s

**Split exit animation — dual panel technique:**
- Two `overflow: hidden` panels: `.panel--top` (top 50%) and `.panel--bottom` (bottom 50%)
- Each contains `.welcome-overlay__bg` absolutely positioned at full 100vh height — top panel's bg anchored `top: 0`, bottom panel's bg anchored `bottom: 0`
- Content is duplicated via a `renderOverlayBg()` function — each call returns new React element
- On `.is-exiting`: top panel `translateY(-100%)`, bottom panel `translateY(100%)` — 550ms `cubic-bezier(0.76, 0, 0.24, 1)`
- Canvas visible below during transition, fully revealed when panels exit

**State machine:** `"visible" | "exiting" | "hidden"` in `MemoryWorkspace`. When `activeStepIndex > 0 && state === "visible"` → set `"exiting"`, setTimeout 600ms → set `"hidden"` (unmount). Initializes to `"hidden"` if page loads with `?step > 0`.

**Files changed:**
- `app/globals.css` — remove old `.memory-canvas-overlay` block; add `.welcome-overlay` system
- `components/memory/MemoryCanvas.tsx` — remove `showOverlay` prop + JSX
- `components/memory/MemoryWorkspace.tsx` — replace `showOverlay` boolean with `overlayState` machine; add overlay JSX

---

## What Was Done (Task 14)

Added shareable URL state — `?scenario=<id>&step=<n>` encodes active scenario and step index so users can share a direct link to any step of any scenario.

**Files changed:**
- `app/page.tsx` — wrapped `<MemoryWorkspace />` in `<Suspense>` (required by Next.js App Router for `useSearchParams`)
- `components/memory/MemoryWorkspace.tsx` — added `useSearchParams` + `useRouter` imports; computed `initialScenarioId` and `initialStep` from URL params before state initialization; added `isInitialMountRef` to skip scenario-reset effect on first mount (preserves URL-derived step); added debounced `router.replace` effect (150ms) that syncs `scenarioId` + `activeStepIndex` to URL on every change

**Architecture decisions:**
- `router.replace` (not `push`) — no history flooding; back/forward goes to the page the user came from, not between steps
- Debounce 150ms — rapid arrow-key presses coalesce into one URL update
- `isInitialMountRef` ref trick — skips the step-reset effect on mount so URL-derived step survives; clears on first real scenario switch so future switches do reset step
- Invalid URL params degrade gracefully: unknown scenario → first scenario; non-numeric / negative step → step 0

**Verification passed:**
- `pnpm test` → 48 tests green ✅
- `pnpm build` → clean, route `/` at 13.3 kB ✅
- `/?scenario=recursive-stack&step=6` → loads step 7/12, banner "Call factorial(1) — base case", Recursive Stack selected in sidebar ✅
- ArrowRight → URL updates from `step=6` to `step=7` ✅
- Scenario switch → URL resets to `step=0` with new scenario ✅
- No console errors ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task14-url-load-step6.png`
- `task14-after-arrow-right.png`
- `task14-scenario-switch.png`

**Deployed to production:** https://visualizeit-two.vercel.app

---

## What Was Done (Task 15)

Added "Share" button to navbar — copies current URL to clipboard and shows "Copied!" confirmation.

**Files changed:**
- `components/memory/MemoryWorkspace.tsx` — added `copied` boolean state; added `<button>` in the right-slot `div` (flex row, 8px gap, left of "About" link); on click: `navigator.clipboard.writeText(window.location.href)`, `setCopied(true)`, `setTimeout(() => setCopied(false), 1500)`; button renders chain-link SVG + "Share" normally; checkmark SVG + "Copied!" when `copied === true`; color and border shift to `var(--color-pointer)` on copied state.

**Verification passed:**
- `pnpm build` → clean, route `/` at 13.7 kB ✅
- `pnpm test` → 48 tests green (no engine changes) ✅
- Share button visible in navbar, left of About link ✅
- Click → "Copied!" with blue accent border and text ✅
- After 1.5s → reverts to "Share" ✅
- No console errors ✅
- Deployed to Vercel production ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task15-share-before.png`
- `task15-share-copied.png`
- `task15-share-reverted.png`

---

## What Was Done (Task 16)

Added step-progress dot row between canvas and step banner — one dot per step, clickable, state-aware.

**Files changed:**
- `components/memory/MemoryWorkspace.tsx` — added `<div className="step-dots">` between `<MemoryCanvas>` and `<StepBanner>`; maps over `snapshots` (indices 0..maxStep); each dot is a `<button>` with `aria-label`, `aria-current`, `onClick={() => handleStepChange(i)}`; className: `step-dots__dot` + `is-active` (current) | `is-past` (index < activeStepIndex) | default (future).
- `app/globals.css` — added `.step-dots` (flex, centered, gap 5px), `.step-dots__dot` (6×6px circle, faint default), `.step-dots__dot.is-past` (`--border-default`), `.step-dots__dot.is-active` (amber, scale 1.5, amber glow shadow), hover scale 1.3.

**Verification passed:**
- `pnpm build` → clean, route `/` at 13.8 kB ✅
- `pnpm test` → 48 tests green ✅
- `recursive-stack` step 7/12: 12 dots, 6 past, 1 amber active (enlarged), 5 faint ✅
- Click dot 3 → jumps to step 3, active dot updates ✅
- No console errors ✅
- Deployed to Vercel production ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task16-dots-step6.png`
- `task16-dots-after-click-dot3.png`

---

## Strategy Decision — Multi-viewport (2026-05-14)

Single-task "mobile responsive" was reframed after design discussion. Full responsive to 375px compromises pedagogy (canvas + explanation can't both be visible at 375px). Decision: **hybrid** — tablet responsive (≥768px) + intentional phone gate (<768px) with `/about` polish.

This splits into **two sessions**:
- **T17a (next session)** — Tablet responsive collapse (768–1023px → single-column).
- **T17b (session after)** — Phone gate (<768px) + `/about` mobile polish.

Full task details, file lists, acceptance criteria for both in [`docs/roadmap/backlog.md`](../roadmap/backlog.md) under T17.

---

## What Was Done (Task 17a)

Tablet responsive collapse (768–1023px) — single-column layout + slide-in drawer for scenarios.

**Decision (confirmed with user at session start):** drawer + hamburger over chip strip. Drawer preserves category groups (Fundamentals / Data Structures / Bugs & Pitfalls) cleanly; chip strip would have flattened them.

**Files changed:**
- `components/memory/MemoryWorkspace.tsx` — added `isSidebarOpen` state (default `false`); hamburger button in brand block (left navbar slot) with `aria-expanded` + `aria-controls`; wrapped `<ScenarioSidebar>` in `.memory-workspace__sidebar-slot` container w/ `role="dialog"` when open; added `<button class="memory-workspace__backdrop">` for tap-to-close; close-on-scenario-select (extended existing `scenarioId` effect with `setIsSidebarOpen(false)`); Escape closes drawer (new `useEffect`).
- `app/globals.css` —
  - **New base styles:** `.memory-workspace__hamburger` (icon button, `display: none` by default), `.memory-workspace__sidebar-slot` (`display: contents` at desktop so sidebar stays in grid), `.memory-workspace__backdrop` (fixed inset, dim, blur, `display: none` by default), `backdrop-fade-in` keyframe.
  - **Replaced** old `@media (max-width: 980px)` block (which hid sidebar entirely) with `@media (max-width: 1023px)`: hamburger visible; main grid collapses to single column with rows `(canvas, panel)`; sidebar-slot becomes `position: fixed` left-anchored drawer (`width: min(280px, 80vw)`, `z-index: 40`, `translateX(-100%)`); `.is-drawer-open` slides drawer in via `translateX(0)` w/ `cubic-bezier(0.32, 0.72, 0, 1)` 280ms; backdrop becomes `display: block` when open; canvas-area moves to row 1, explanation panel to row 2 (`max-height: 50vh`); brand-chip hidden; progress wrap shrunk to 180px.
  - **Replaced** old `@media (max-width: 720px)` / `(max-width: 560px)` blocks with `@media (max-width: 767px)`: brand-name hidden; controls wrap; progress flexes; navbar-meta condensed. (T17b will replace this with phone gate.)

**Architecture decisions:**
- `display: contents` on `.memory-workspace__sidebar-slot` at desktop keeps the existing 3-column grid `220px / 1fr / 340px` intact — the wrapper is invisible to layout, and `.scenario-sidebar` itself sits in column 1 as before. At tablet the wrapper switches to `display: block` + `position: fixed`, removing itself from grid flow and floating as a drawer.
- Drawer slide uses `transform` only (no width/layout changes) so animation stays on the compositor.
- Backdrop is a `<button>` (not a `div`) so keyboard users get free focus + Enter/Space activation.
- Escape closes drawer via a scoped listener (active only while open) — avoids leaking handler when desktop.

**Verification passed:**
- `pnpm test` → 48 tests green ✅
- `pnpm build` → clean; route `/` at 14.2 kB (was 13.8 kB) ✅
- Smoke (`smoke-task17a-tablet.mjs` w/ Playwright) at 768 / 1024 / 1280:
  - 768×1024: no horizontal scroll (`scrollWidth - clientWidth = 0`); drawer opens on hamburger tap; selecting "Heap Blocks" auto-closes drawer + switches scenario; explanation panel docked below canvas ✅
  - 1024×768: hamburger hidden (computed style `display: none`); 3-column layout preserved ✅
  - 1280×800: same as 1024 — desktop intact ✅
  - Zero console errors at all widths ✅
- Deploy: https://visualizeit-fht901xyb-uicabgadiel67-1227s-projects.vercel.app — status `● Ready` ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task17a-load-768.png` / `task17a-load-1024.png` / `task17a-load-1280.png` (initial recursive-stack step 7)
- `task17a-drawer-open-768.png` (drawer slid in over dimmed canvas)
- `task17a-after-select-768.png` (drawer closed, Heap Blocks active)

**Phone (<768px) status:** Still inherits the tablet drawer rules — hamburger works, canvas + panel stack — but navbar controls + canvas region overflow are not gated. T17b will introduce the phone gate (per backlog) that fixes this intentionally rather than mechanically.

**Known minor visual at 768px:** step counter "8 / 12" sits very close to the speed selector in the navbar (no overlap, but tight). Acceptable for this session — if T17b user-tests catches it, fix at that point by giving controls `flex-wrap: wrap` at the 768 edge or trimming step text to bare number.

---

## What Was Done (Task 17b)

Added phone gate (<768px) + `/about` mobile audit. All T17 items now complete.

**Files changed:**
- `components/memory/PhoneGate.tsx` — **new**. Fullscreen gate component: VisualizeIT logo SVG (amber glow), display-font headline "Stack frames + pointers / need room", sub-label with amber-accented "≥768px", uppercase label, Copy Link button (amber, reuses `navigator.clipboard.writeText(window.location.href)` + 1500ms "Copied!" state), "Read the overview" link → `/about`, footer note "This link keeps your scenario + step". Self-contained, no props.
- `components/memory/MemoryWorkspace.tsx` — added `isPhone` state (default `false` for SSR safety); `useEffect` with `matchMedia("(max-width: 767px)")` listener (sets state on mount + on resize); after the "no scenario" early return, added `if (isPhone) return <PhoneGate />`; imported `PhoneGate`.
- `app/globals.css` — removed T17a `@media (max-width: 767px)` placeholder block (dead code, superseded by gate); added `.phone-gate` / `.phone-gate__bg` / `.phone-gate__logo` / `.phone-gate__headline` / `.phone-gate__line1/.line2` / `.phone-gate__sub` / `.phone-gate__accent` / `.phone-gate__label` / `.phone-gate__actions` / `.phone-gate__copy-btn` / `.phone-gate__about-link` / `.phone-gate__footer-note` — matches welcome-overlay aesthetic (dot grid bg, amber radial glow, violet depth, staggered `overlay-item-in` animations; reuses `overlay-item-in` keyframe already defined).
- `app/about/page.tsx` — added `@media (max-width: 480px)` block in inline `<style>`: reduces hero title from min 40px to `clamp(28px, 9vw, 40px)`, reduces hero margin-bottom 64→48px, reduces description font-size 16→15px, reduces card gap 20→12px and padding 16/20→14/16px, reduces footer margin-top 64→48px.

**Architecture decisions:**
- `isPhone` initialized to `false` — avoids SSR/hydration mismatch (server always renders workspace, client corrects after mount if phone).
- Gate is placed after the "no scenario" guard so it always renders when `isPhone`, regardless of scenario state.
- `PhoneGate` uses `window.location.href` directly in the click handler — safe because component only renders client-side after matchMedia fires.
- `overlay-item-in` keyframe reused from existing CSS — no duplication.
- Old `@media (max-width: 767px)` placeholder removed cleanly — gate fully replaces that concern.

**Verification passed:**
- `pnpm test` → 48 tests green ✅
- `pnpm build` → clean; route `/` at 14.6 kB (was 13.8 kB) ✅
- Playwright at 375×667: `.phone-gate` visible, no horizontal scroll (0px), no workspace bleed-through ✅
- Playwright at 414×896: gate visible ✅
- Playwright at 767×1024: gate visible (edge case, <768px) ✅
- Playwright at 768×1024: `.phone-gate` count 0, `.memory-workspace` visible, hamburger visible (T17a tablet drawer intact) ✅
- `/about` at 375×667: no horizontal scroll (0px), hero + cards + nav legible ✅
- No console errors at any width ✅
- SSR hydration: no mismatches (matchMedia starts at `false`) ✅

**Screenshots saved to `tmp-screenshots/`:**
- `task17b-gate-375.png` — gate fullscreen on 375×667
- `task17b-gate-414.png` — gate on 414×896
- `task17b-gate-767.png` — gate on 767×1024
- `task17b-workspace-768.png` — T17a tablet layout at 768×1024 (gate absent)
- `task17b-about-375.png` — `/about` at 375×667

**Production URL:** https://visualizeit-7r0e4jlia-uicabgadiel67-1227s-projects.vercel.app


---

## What Was Done (T-REFACTOR-1) — 2026-09-28 — branch `refactor/t-refactor-1`

Single source of scenario truth. Removed every hardcoded scenario count/list:

- `PhoneGate.tsx` — was "7 scenarios" (stale, actual 8) → `memoryEngineScenarios.length`.
- `MemoryWorkspace.tsx` welcome overlay — "8 scenarios" → derived.
- `app/about/page.tsx` — deleted duplicated 8-entry hardcoded list; maps `memoryEngineScenarios` with `categoryTones` (category→card color) + typed `categoryColors`. Count + hero + metadata.description derived from `scenarioCount`. Slight copy deltas (marketing rewordings) lost by design — fixtures is now the only truth.
- Drive-by: fixed pre-existing lint error on main (`explainEvent.test.ts:236` non-null assertion → `snapshots.at(-1)` + throw guard). Lint scope `app components features` now clean.

Verify: 49/49 tests · eslint clean · `next build` OK incl. static prerender of `/about` (runtime-validates the map).


---

## What Was Done (T-REFACTOR-3) — 2026-09-28 — branch `refactor/t-refactor-3`

WRITE_ARRAY_INDEX consistency. Engine guards mirrored from WRITE_FIELD:

- `memoryEngine.ts` `case "WRITE_ARRAY_INDEX"` — (1) freed block → `USE_AFTER_FREE` diagnostic + write skipped (was: silent write into dead block); (2) `index >= capacity > 0` → `BUFFER_OVERFLOW` diagnostic, write still lands (matches WRITE_FIELD overflow behavior); (3) pinned decision **zero-fill to index**: intermediate slots pushed as `{kind:"number", value:0}` `array-slot` before the write — `fields` can no longer contain holes, so `layoutMemoryScene` `.map` over undefined nodes (draw crash path) is structurally impossible.
- `memoryEngine.test.ts` +3 tests: freed-block write → USE_AFTER_FREE + fields unchanged; `[9]` on capacity-3 → BUFFER_OVERFLOW + dense 10-slot array, `[9]` = written value; all-8-scenarios hole-scan across every snapshot (invariant guard for future scenarios).

Known semantics (pinned): capacity 0 (malloc without declared fields) never overflows — same `capacity > 0` gate as WRITE_FIELD. Repeated overflow writes each re-emit the diagnostic (per-write = honest C). Negative/fractional index robustness deferred to T-REFACTOR-2 validator (throw→diagnostic step 2 covers bad commands).

**Env note:** `pnpm test`/`pnpm build` wrappers fail pre-existing `ERR_PNPM_IGNORED_BUILDS` (puppeteer/sharp/unrs-resolver) — run `pnpm approve-builds` once to fix. Equivalent `npx vitest run` (52/52 green) + `npx eslint app components features` (0 errors) + `npx next build` (route `/` 15.4 kB) all green. No UI touched — no browser smoke needed.

---

## What Was Done (T-REFACTOR-2) — 2026-09-28 — branch `refactor/t-refactor-2`

Fixture validator + throw→diagnostic. `runMemoryProgram` is now total — a typo in a new scenario can no longer crash the page via `useMemo`.

- `domain/diagnostics.ts` — new `INVALID_TARGET` error type. `explainEvent.ts` if-chain skips unknown types (tolerant, no edit needed); `layoutMemoryScene.ts` renders any diagnostic generically (message/severity) — verified, no edits.
- `simulation/memoryEngine.ts` — 7 throws → `createDiagnostic("INVALID_TARGET", ...)` + no-op: `currentFrame` returns `StackFrame | null` (DECLARE w/o frame), `readTarget` unknown var/field → returns `{kind:"null"}` + diagnostic, `writeTarget` unknown → diagnostic + skip, `WRITE_FIELD`/`WRITE_ARRAY_INDEX`/`FREE` unknown block → diagnostic + return. Only remaining throw = `getFinalSnapshot` (test util, out of engine path).
- `simulation/validateScenario.ts` (new, pure) — `validateScenario`/`validateScenarios`: ids unique, `stepToLine.length === commands.length` + in-bounds, static walk (frames/declared vars/malloc count) checks every referenced `blockId`/variable exists at that step, try/catch run + zero `INVALID_TARGET` in output snapshots.
- `memoryEngine.test.ts` +19 tests — `describe.each` over all 8 scenarios (validator zero-issues, engine total, **golden parity**: djb2 hash of full+final snapshot JSON pinned pre-refactor → byte-identical confirmed); bad-fixture test: no throw, snapshots returned, ≥3 INVALID_TARGET; validator flags deliberate bad fixture.

Verify: 71/71 tests (`pnpm --config.verify-deps-before-run=false test` — pnpm pre-run install still trips ERR_PNPM_IGNORED_BUILDS, untracked `pnpm-workspace.yaml` placeholder untouched) · eslint clean · build OK. No UI touched — no browser smoke.

## What Was Done (T-REFACTOR-4a) — 2026-09-28 — branch `refactor/t-refactor-4a`

Extract workspace hooks — pure move, no logic rewrite. `MemoryWorkspace.tsx` 442 → 389 lines.

- `components/memory/hooks/useUrlState.ts` (new) — `useUrlState()` = URL parse (`:24-31`) + `scenarioId`/`stepIndex` state; `useUrlSync(scenarioId, activeStepIndex)` = debounced `router.replace` effect (`:117-123`). Split into two hooks because clamped `activeStepIndex` depends on `maxStep` (derived after the hook call) — call order inverted without changing behavior.
- `components/memory/hooks/usePlayback.ts` (new) — `isPlaying`/`playbackSpeed` state (`:38,40`) + auto-advance interval effect (`:163-178`); takes `{activeStepIndex, maxStep, setStepIndex}`; exports shared `clampStep` (was workspace-local `:20-21`).
- `components/memory/hooks/useMediaViewport.ts` (new) — phone `matchMedia` effect (`:109-115`) + `containerWidth`/`canvasAreaRef` ResizeObserver (`:41,47,125-134`).
- Workspace deps `[scenarioId]`/`[maxStep, isFullscreen]` widened with the (runtime-stable) setters — exhaustive-deps can't prove stability across hook boundaries; no behavior change.
- Acceptance check: keyboard/playback/URL-sync logic byte-identical, just relocated.

Verify: 71/71 tests · eslint 0 problems · build clean (`/` 15.7 kB, +0.3 from hook boundary) · Playwright smoke 10/10: deep-link `?scenario=buffer-overflow&step=4` restores + URL stable, space/pause toggle, welcome overlay at `/`, tablet drawer open+Esc at 820px, phone gate at 375px (no canvas).

## What Was Done (T-REFACTOR-4b) — 2026-09-28 — branch `refactor/t-refactor-4b`

Extract toolbar + welcome overlay. `MemoryWorkspace.tsx` 389 → 269 lines; zero `style={{` left in `components/`.

- `components/memory/WorkspaceToolbar.tsx` (new) — Focus/Share/About block (`:198-283`); owns `copied` state + clipboard/1.5s reset (`:29`) internally; `isFullscreen`/`onToggleFullscreen` stay in workspace (keyboard `f`/Esc depend on it).
- `components/memory/WelcomeOverlay.tsx` (new) — `overlayBg()` + `renderWelcomeOverlay()` moved as-is; `overlayBg` re-render deduped via one `<OverlayBg />` component per panel (`:385-386`). Overlay remains `pointer-events:none` desktop by design — behavior unchanged.
- `app/globals.css` — new classes after `.memory-workspace__navbar-center`: `.memory-workspace__toolbar` (+`-btn`, `.is-active`, `.is-copied`, `-link`) mirroring old inline styles 1:1; `.memory-workspace__empty` replaces `style={{padding:"32px"}}` (`:142`).
- Workspace drops `Link` import + `copied` state; JSX floor reached — remaining lines are orchestrator state/effects (4a scope).

Verify: vitest 71 green · eslint `app components features` 0 problems · `next build` clean (/ = 15.6 kB). Playwright smoke 18/18 GREEN (prod start): overlay visible→dismiss, Focus toggle + Esc, Share→Copied!→reset + clipboard URL, deep-link restore, tablet drawer, phone gate. Note: `pnpm exec` trips on `ERR_PNPM_IGNORED_BUILDS` (untracked `pnpm-workspace.yaml` has placeholder `allowBuilds` entries — env, pre-existing); used `./node_modules/.bin/*` directly.

## What Was Done (T-REFACTOR-5) — 2026-09-28 — branch `refactor/t-refactor-5`

BrandMark component — logo SVG deduped 4× → 1.

- `components/BrandMark.tsx` (new) — `size` + `className` props; amber fill now `var(--accent-amber)` (token was hardcoded `#F5B82E` at every use site); ink path + violet border literals kept 1:1 (0.35 alpha ≠ `--accent-violet-border` 0.4 — visual parity preserved).
- Swaps: `MemoryWorkspace.tsx` navbar logo 22px, `WelcomeOverlay.tsx` 60px ×2 panels (split-wipe design kept), `PhoneGate.tsx` 52px, `app/about/page.tsx` 20px. `app/icon.svg` untouched (static asset).
- Acceptance: `grep -rn "F5B82E" components app` → 0 hits in TS/TSX (only token definition in `globals.css:56` remains).
- Verify: 71 tests green · eslint clean · build clean (Static) · Playwright smoke: navbar/welcome/phone/about logos render, console clean.
- Env note: untracked `pnpm-workspace.yaml` has placeholder `allowBuilds` values → `pnpm test` fails deps-check; ran with `--config.verify-deps-before-run=false`. Needs user fix (approve-builds or delete file).

## What Was Done (T-REFACTOR-6) — 2026-09-28 — branch `refactor/t-refactor-6`

layoutFrame extraction — killed ~55-line live-loop vs released-ghost-map duplication in `layoutMemoryScene.ts`.

- New module-level `layoutFrame(frame, y, opts, isReleased): {node, nextY, pointerSources, selectables}` (after `selectionPriority`); live loop (old `:171-227`) + ghost map (old `:231-269`) now call it. Live keeps pointer targets + variable/frame selectables; released → null pointers + trailing `opacity:0.3`/`released:true` via conditional spreads (key presence/order identical). `StackVariable` type import added. 461 → 483 lines but frame geometry exists once — T-CONTENT-4/7 static/rodata lanes call `layoutFrame` instead of copying a third time.
- Behavior identity proven pre-merge: temporary golden harness — 8 scenarios × all snapshots × 3 region variants (default / heap-hidden / stack-hidden) `toEqual` pre-refactor JSON (~800 KB) → pass; temp test + golden file deleted after verify.
- Verify: vitest 71 green · eslint `app components features` 0 problems · `next build` clean (/ = 15.9 kB). UI untouched (proven identical output) → no Playwright smoke.
- Env fixed: untracked `pnpm-workspace.yaml` `allowBuilds` placeholders → `false` (puppeteer/sharp/unrs-resolver; no install scripts run) → `pnpm test`/`pnpm build` deps-check green again. File still untracked — user call: keep, commit, or delete.

## What Was Done (T-REFACTOR-7) — 2026-10-03 — branch `refactor/t-refactor-7`

tweenRenderModel complete contract — optional-field landmine defused.

- `rendering/interpolateScene.ts` `tweenRenderModel` (`:217`) — return now `{ ...next, <4 tweened arrays> }`: ALL non-tweenable fields (bounds, selectables, `stackLane`, `heapLane`, `releasedFrames`, any future optional field) pass through from `next`; contract pinned in comment. Output parity: `bounds`/`selectables` came from `next` before too — identical.
- `MemoryCanvas.tsx:75` — manual re-injection patch `{...tweened, stackLane: scene.stackLane, heapLane: scene.heapLane, releasedFrames: scene.releasedFrames}` deleted → `paint(tweened)`. t=1 direct-paint path untouched.
- `interpolateScene.test.ts` — new describe `tweenRenderModel — non-tweenable field passthrough (T-REFACTOR-7)`: lanes + released ghosts present at t=0.5; passthrough holds at t=0/t=1. 11 → 13 tests.
- Verify: scoped vitest 13 green → `pnpm test` 73 green (5 files) · eslint `app components features` 0 problems · `pnpm build` clean (/ = 15.8 kB). Playwright smoke (dev): deep-link recursive-stack, 4 step-throughs w/ canvas pixel probes mid-tween (non-blank at each `t<1` frame incl. ghost-release zone 7→12/12), step sync, console 0 errors.
- Next: T-REFACTOR-8 (P2, dead code prune).

## What Was Done (T-REFACTOR-8) — 2026-10-03 — branch `refactor/t-refactor-8`

Dead code prune — Phase 1 debug-view leftovers removed.

- `domain/snapshots.ts:31-45` — deleted `cloneSnapshot` + `getSnapshotSummary` (zero consumers). `getFinalSnapshot` kept (lives in `memoryEngine.ts`, test consumers in `explainEvent.test.ts` — untouched).
- Grep-confirm repo-wide after delete: 0 code refs (only backlog task text). No `snapshots.test.ts` existed → no scoped vitest file; types/imports above lines 1-29 still used, retained.
- Files touched: 1 (+2 docs). Edit via cavecrew-builder, anchors + snippet inline.
- Verify: `pnpm test` 73 green (5 files) · eslint `app components features` 0 problems · `pnpm build` clean. No UI touched → no smoke.
- Next: T-REFACTOR-9 (P2, URL sync first-mount guard).

## What Was Done (T-REFACTOR-9) — 2026-10-03 — branch `refactor/t-refactor-9`

URL sync first-mount guard — clean `/` no longer rewritten to `/?scenario=...&step=0`.

- Pinned anchors `MemoryWorkspace.tsx:117-123` were stale (URL sync lives in `components/memory/hooks/useUrlState.ts:21-31`, extracted in T-REFACTOR-4a). Edited `useUrlSync` there instead.
- Fix: inside the 150ms debounce, parse `window.location.search`; treat absent `scenario`/`step` as defaults (first fixture id / 0, same semantics as `useUrlState`); skip `router.replace` when derived state equals current URL. Deps add `firstScenarioId`.
- Acceptance verified via Playwright smoke (webapp-testing, `pnpm dev` :3000): `/` stays `/` · `?scenario=buffer-overflow&step=4` restores · ArrowRight → URL `step=5` · 0 console errors.
- Files touched: 1 (+2 docs). Edit via cavecrew-builder, anchors + snippet inline. No test file for hook → no scoped vitest target.
- Verify: `pnpm test` 73 green · eslint `app components features` 0 problems · `pnpm build` clean.
- Next: T-REFACTOR-10 (P2, MemoryRef target model — schema freeze for WASM).

## What Was Done (T-REFACTOR-10) — 2026-10-03 — branch `refactor/t-refactor-10`

MemoryRef target model — snapshot/target schema frozen for WASM parity (Phase 3 gate).

- `domain/types.ts`: `ValueTarget` += `{kind:"stackSlot", frameHint?, name, index?}`; `PointerValue` += optional `targetVariable?: {frameId, name}` (pointer-to-stack, `**pp`). Additive/optional-only → all 8 shipped snapshots byte-identical (verified: `GOLDEN_SNAPSHOT_HASHES` unchanged, green).
- `simulation/memoryEngine.ts`: `findStackSlot` resolver (reverse frame scan, frameHint = frame id or functionName) at `:92`; readTarget/writeTarget stackSlot branches; `normalizeValue` preserves `targetVariable` (status `valid`); ASSIGN_POINTER with `{kind:"target", target:{kind:"stackSlot"}}` emits pointer-to-stack. Pinned semantics (commented): `index` reserved for T-CONTENT-2 stack arrays — `index > 0` → INVALID_TARGET, slot 0/undefined = scalar slot; engine stays total.
- `domain/commands.ts` describeTarget +stackSlot; `validateScenario.ts` checkTarget treats stackSlot like variable. pedagogy covered via describeTarget; layout/draw untouched (targetBlockId-null already skips pointer edge) — pointer-edge-to-frame-row lands with T-CONTENT-3 UI.
- Files touched: 5 (types, commands, memoryEngine, validateScenario, memoryEngine.test). Edits via cavecrew-builder, snippets + anchors inline.
- Verify: scoped vitest 35/35 · `pnpm test` 77 green (+4: stackSlot round-trip, `**pp` targetVariable + JSON round-trip, frameHint recursion, INVALID_TARGET totals) · eslint 0 problems · `pnpm build` clean (route `/` 16.2 kB). No UI touched → no Playwright.
- Next: T-REFACTOR-11 (P2, golden parity vectors — pure test).

## What Was Done (T-REFACTOR-11) — 2026-10-03 — branch `refactor/t-refactor-11`

Golden parity vectors — WASM harness groundwork. Pure test, zero product risk.

- `memoryEngine.test.ts` += describe "golden parity vectors (T-REFACTOR-11)" (`:464`): per-scenario table `GOLDEN_FINAL_SNAPSHOT_SHA256` (`:467`) pinning `sha256(JSON.stringify(finalSnapshot))` for all 8 scenarios (`it.each` over `[id, scenario]` tuples — vitest spreads rows as args, callback `(id, scenario)`) + serializability invariant test: every snapshot of every scenario round-trips `JSON.parse(JSON.stringify(...))` → `toEqual` (worker/WASM boundary requirement).
- Hashes generated via throwaway `goldenHash.gen.test.ts` (vitest + `node:crypto`, env node), written to JSON, pinned into table, temp file deleted. Regeneration path documented in table comment.
- Relation to existing goldens: T-REFACTOR-2 djb2 table (`:309`, `{all, final, steps}`) stays as in-repo regression net; new sha256 vectors are the cross-language parity target for Phase 3 (djb2 = ad-hoc, 32-bit; sha256 = standard digest).
- Files touched: 1 (memoryEngine.test.ts, +35 lines). Append via cavecrew-builder; hash-fill + it.each signature fix inline.
- Verify: scoped vitest 44/44 · `pnpm test` 86 green (+9: 8 hash vectors + 1 round-trip) · eslint 0 problems · `pnpm build` clean. No UI touched → no Playwright.
- Next: T-REFACTOR-12 (P3, allocator model — Phase 3 gate, needs explicit approval).

## What Was Done (T-UX-2) — 2026-10-03 — branch `feature/t-ux-2`

Canvas zoom in/out — first task outside the (now-complete, minus gated T-REFACTOR-12) Refactor Queue; picked via fallback chain P0 done (T17a/b) → first open P1.

- New `features/memory-engine/rendering/zoom.ts`: `MIN_ZOOM 0.5` / `MAX_ZOOM 2` / `ZOOM_STEP 0.1`, `clampZoom` (1-decimal round → no float drift), `zoomByWheel`, `maxAreaScale` + `MAX_CANVAS_AREA_PX = 16M` (iOS Safari blank-canvas guard: bitmap area capped, dpr component sacrificed before zoom). `zoom.test.ts`: 4 cases.
- `MemoryCanvas.tsx`: `zoom`/`onZoomChange` props. Zoom applied in `paint`: bitmap = bounds×dpr×z clamped by area cap, CSS box = bounds×z, `setTransform(scale)`. Hit-test untouched — `getBoundingClientRect` ratio math is zoom-invariant (backlog's "verify" → confirmed by reviewer + smoke). Zoom read via `zoomRef` (NOT effect deps) → wheel/dblclick never restart mid-flight tweens; `idlePaintRef` repaints only when idle. Wheel: native listener `passive:false` on canvas (React root wheel listener is passive → `onWheel` JSX cannot `preventDefault`), ctrl/cmd-only, ref updated synchronously per event → no dropped deltas. Dblclick → reset 1×.
- `MemoryWorkspace.tsx`: `zoom` state + `.memory-canvas-zoombar` row (−/reset-%/+) above shell inside canvas-area; buttons disabled at limits. `globals.css`: zoombar styles (existing tokens only); `.memory-canvas-shell` grid-centering moved to new `.memory-canvas-viewport` wrapper (min-100% grid) because `place-items:center` + `overflow:auto` makes scroll-start unreachable — wrapper grows to zoomed content → overflow stays scrollable from origin.
- Files: 5 (2 new + 3 edit) — within guard. Reviewer follow-ups skipped (scope): trackpad pinch proportional deltaY step; multiplicative zoom curve.
- Verify: zoom.test 4/4 · `pnpm test` 90 green (+4) · eslint 0 · `pnpm build` clean · Playwright smoke 1280×900: +→120% CSS width ×1.2 asserted, ctrl+wheel→110%, dblclick→100%, clamp 50/200% with disabled btns, step-nav while zoomed, 0 console errors. Screenshots `tmp-screenshots/zoom-120.png`, `zoom-step-110.png`. Not deployed.
- Next: T-REFACTOR-12 (P3, allocator model — needs explicit approval) or next P1 (T-UX-3 may already be covered by `interpolateScene` — audit before picking; then T-CONTENT-2).

## What Was Done (T-UX-3) — 2026-10-03 — branch `feature/t-ux-3`

Animated step transitions (morph) — acceptance audit per T-UX-2 note: lerp/fade-in/fade-out/reduced-motion already shipped via `interpolateScene.ts` (opacity `t`/`1−t` on nodes/frames/blocks/edges/badges) + `MemoryCanvas` rAF tween (`:70-93`, snap paths: first render, reduced-motion, `stepDelta>1`). Sole unmet criterion: "disabled when user holds Shift (instant)".

- `MemoryCanvas.tsx`: `instant?: boolean` prop → `shouldSnap` (`:59`) `|| instant`; added to effect deps (`:94`). Comment updated.
- `MemoryWorkspace.tsx`: `instantStep` state (`:37`); `e.shiftKey` on ArrowRight/Left (`:112-120`) sets flag same batched commit as `setStepIndex` → child effect consumes snap; parent one-shot reset effect (`:133-136`) clears flag next commit (child-before-parent effect order guarantees canvas sees `true` first). Passed `instant={instantStep}` to canvas (`:267`).
- Files touched: 2. No tween-engine change, no new tests possible (component-level flag; covered by smoke).
- Verify: `pnpm test` 90 green · eslint 0 problems · `pnpm build` clean · Playwright smoke 1280×800 `?scenario=buffer-overflow&step=1`: ArrowRight→Shift+ArrowRight→URL `step=3`, Shift+ArrowLeft→`step=2`, 0 console errors, screenshot `/tmp/t-ux-3-smoke.png`.
- Next: first open P1 → T-CONTENT-2 (stack arrays `int arr[5]`; T-REFACTOR-10 `stackSlot.index` pre-wired for it) or T-EDU-1/T-TECH-1. T-REFACTOR-12 stays gated.
