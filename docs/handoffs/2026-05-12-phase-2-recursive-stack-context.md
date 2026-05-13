# Handoff — Recursive Stack: Tasks 1 & 2 Done / Task 3

**Date:** 2026-05-13
**Status:** Task 1 complete. Task 2 complete. Task 3 pending.

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

## Task 12 — Next Session

> **Context:** This is VisualizeIT, a Next.js app that visualizes C memory concepts interactively. The memory engine lives in `features/memory-engine/`. The UI renders 7 scenarios from a sidebar; the canvas draws stack frames and heap blocks step-by-step with per-step line highlighting in a Code tab and pedagogical text in an Explanation tab.
>
> Tasks 1–11 are complete: 7 scenarios, canvas ResizeObserver fix, recursive-aware + diagnostic-aware explanations (48 tests), real C source code for all scenarios, production deployment, and a static `/about` page.
>
> **Current state:** The app is live at https://visualizeit-uicabgadiel67-1227s-projects.vercel.app. The `/about` page at `/about` lists all 7 scenarios. The next priority is improving the landing experience — when a user first opens the app, they see the first scenario (`stack-frame-basics`) at step 0 with nothing drawn. A welcome / empty state should guide them to press Play or select a scenario.
>
> **Task 12:** Add a welcome empty-state overlay to the canvas area.
>
> **Implementation steps:**
> 1. In `components/memory/MemoryCanvas.tsx` (or `MemoryWorkspace.tsx`), detect when `stepIndex === 0` (the initial state before any commands run).
> 2. When `stepIndex === 0`, render a centered overlay inside `.memory-canvas-shell` with:
>    - The VisualizeIT logo SVG (same as in the navbar)
>    - A short headline: "Step through C memory, live."
>    - A one-line hint: "Press Play or use → to advance step by step."
>    - Optional: keyboard shortcut chips for Space (play) and → (next step)
> 3. When `stepIndex > 0`, the overlay disappears and the canvas renders normally.
> 4. Style using existing design tokens — same dark palette, `--font-display` for headline, `--text-secondary` for hint.
> 5. Run `pnpm build` → confirm clean. Run `pnpm test` → confirm 48 tests still green.
> 6. Deploy to Vercel: `vercel deploy --prod -y --scope uicabgadiel67-1227s-projects`.
> 7. Verify the overlay appears on first load and disappears after stepping.
>
> **Verification criteria:**
> - `pnpm build` clean.
> - `pnpm test` → 48 tests green.
> - Overlay visible at step 0 on first load.
> - Overlay gone after pressing → once.
> - No regressions on any of the 7 scenarios.
> - Upgrade this handoff for the next task (one task per session).
