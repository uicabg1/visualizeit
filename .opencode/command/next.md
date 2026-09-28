---
description: Executes the next (or given) backlog task end-to-end — branch, verify, merge, push. Usage: /next or /next T-REFACTOR-3
agent: build
---

Run one VisualizeIT queue task, full protocol from `docs/roadmap/backlog.md`. Caveman-compressed output. Never re-read whole files.

1. **Context:** read `docs/roadmap/backlog.md` (Refactor Queue + matching section) and `docs/checkpoints/current-state.md`. Do not open code yet.
2. **Pick task:** if `T-REFACTOR-3` is a task ID use it; otherwise (empty arg) take highest open task: T-REFACTOR → P0 → P1 → P2, first not struck-through. Echo chosen ID + priority before starting.
3. **Branch:** `git checkout main && git pull`, then `refactor/<id>` (or `fix/<id>` if behavior bug).
4. **Execute** using the task's pinned `file:line` anchors. Token-saving rules (backlog §Refactor Queue):
   - Read windows max ±30 lines around anchors; `grep -n` over Read.
   - Subagents only via `.opencode/agent/cavecrew-*`, snippets + anchors inline in their prompts; builder gets target files explicitly; no `Explore`/`general`.
   - >5 files or unclear scope → STOP, report, split into next session. No scope creep.
5. **Verify before merge:** scoped `npx vitest run <touched>.test.ts` → `pnpm test` → `npx eslint app components features` → `pnpm build`. UI touched → Playwright smoke via webapp-testing skill. All green or nothing merges.
6. **Close:**
   - Append `## What Was Done (<id>) — <date> — branch refactor/<id>` block to `docs/handoffs/2026-05-12-phase-2-recursive-stack-context.md`.
   - Backlog: strike task heading, mark DONE + branch, update header "Last updated".
   - Commit `refactor: <id> <summary>`, merge `--no-ff` to main, push main, delete branch. Deploy only if explicitly asked in the arg.
7. **Report:** ≤8 lines — changes, tests result, commit hash, next task ID.

Failure anywhere = stop, report exact error + state, leave branch for next session. Never merge red tests.
