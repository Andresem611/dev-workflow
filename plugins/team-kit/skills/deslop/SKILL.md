---
name: deslop
description: Remove AI-generated slop from the current branch's diff vs main — stray/over-explanatory comments, defensive try/catch on trusted paths, `any` casts that only silence types, needless deep nesting. Surgical and behavior-preserving. Use right after generating code, before review. For a general clarity/maintainability refactor of an existing target (not branch-diff slop), use `code-simplifier` instead.
---

# Remove AI code slop

Check the diff against main and remove AI-generated slop introduced in the branch.

> **Scope vs `code-simplifier`:** `deslop` only touches what *this branch's diff* added, removing AI-generated junk with minimal edits. Reach for `code-simplifier` when you want a broader clarity refactor of existing code regardless of the diff. Typical pairing: `deslop` (strip the junk) → `thermo-nuclear-code-quality-review` (structural review).

## Focus Areas

- Extra comments that are unnecessary or inconsistent with local style
- Defensive checks or try/catch blocks that are abnormal for trusted code paths
- Casts to `any` used only to bypass type issues
- Deeply nested code that should be simplified with early returns
- Other patterns inconsistent with the file and surrounding codebase

## Guardrails

- Keep behavior unchanged unless fixing a clear bug.
- Prefer minimal, focused edits over broad rewrites.
- Keep the final summary concise (1-3 sentences).
