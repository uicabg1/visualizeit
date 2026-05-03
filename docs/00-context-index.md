# VisualizeIT Context Index

Purpose: keep ChatGPT Plus conversations small by loading only the documentation needed for the current phase.

## Project Decision

VisualizeIT will be built as a modular technical visualization platform, but the MVP is intentionally narrow:

> Build one excellent interactive experience first: the Low-Level Memory Engine for C memory visualization.

IPv6/SLAAC, discrete mathematics, and XAI remain future modules.

## Token-Saving Method

Do not paste every document into one ChatGPT conversation. Use small context packs.

### Context Pack A: Architecture

Use when asking for system design, project scaffolding, or technical structure.

Include:

- `README.md`
- `docs/architecture/01-system-architecture.md`
- `docs/architecture/02-directory-structure.md`
- `docs/architecture/03-performance-and-simulation-strategy.md`

### Context Pack B: MVP Product Scope

Use when asking for UI flows, component planning, or feature breakdown.

Include:

- `README.md`
- `docs/mvp/01-memory-engine-functional-spec.md`
- `docs/mvp/02-memory-engine-roadmap.md`

### Context Pack C: Implementation Planning

Use when asking ChatGPT to create a coding plan.

Include:

- `docs/architecture/02-directory-structure.md`
- `docs/architecture/03-performance-and-simulation-strategy.md`
- `docs/mvp/01-memory-engine-functional-spec.md`
- `docs/mvp/02-memory-engine-roadmap.md`

### Context Pack D: Future Expansion

Use only after the memory MVP is working.

Include:

- `README.md`
- `docs/future-modules/01-expansion-backlog.md`

### Context Pack E: ChatGPT Plus Workflow

Use before starting implementation in ChatGPT Plus or when context is getting messy.

Include:

- `docs/chatgpt-context/metodologia.md`
- `docs/chatgpt-context/02-metodo-chatgpt-plus-y-preservacion.md`
- `docs/chatgpt-context/01-session-prompts.md`

For normal task execution, prefer `docs/chatgpt-context/metodologia.md` first. Use the longer preservation document only when you need the full backup and workflow rationale.

## Prompt Prefix For Future Sessions

Use this short prefix before pasting one context pack:

```text
You are acting as a senior software architect and technical lead. Work only from the documents I provide in this message. Do not expand scope beyond the current MVP unless I explicitly ask. Prefer modular files, small interfaces, deterministic simulation logic, and token-efficient explanations.
```

## Guardrails

- Do not ask for all project files unless necessary.
- Do not implement future modules during the Memory Engine MVP.
- Do not put LLM calls inside the render loop or simulation loop.
- Do not use 3D for the memory engine unless there is a clear learning benefit.
- Keep implementation prompts focused on one phase at a time.
