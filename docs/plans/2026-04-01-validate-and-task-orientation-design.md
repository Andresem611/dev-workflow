# VALIDATE Runtime Testing + Task Orientation + Inner Loop Tracking — Design Document

**Date:** 2026-04-01
**Status:** Brainstorm complete, pending eng review
**Target:** dev-pipeline-backend v3.5.0 + dev-pipeline-frontend v4.2.0
**Related:** BUILD Phase Overhaul v3.4.0/v4.1.0 (4-layer verify-fix loop, already shipped)

## Problem Statement

Two fundamental issues discovered during pipeline testing:

### 1. VALIDATE never runs the app

The VALIDATE phase dispatches code-reading agents (rails-expert, security-engineer, code-reviewer) that grep/read files and report findings. Nobody ever starts the server, hits an endpoint, or opens a page. Features ship without runtime verification.

**Evidence:** All 5 audited features (Google Calendar, Unified Conflict Service, Partner Credit, Classroom Todo, Summer Academy) passed VALIDATE without any endpoint or UI being tested at runtime.

### 2. BUILD/DOCUMENT over-specifies tasks

DOCUMENT creates 6-8 tasks per wave at file-type granularity (one task per model, controller, service, spec). Each task includes TDD step-by-step instructions. Agents follow recipes instead of solving problems. When the recipe is wrong, the implementation is wrong.

**Evidence:** Task files from completed features prescribe exact file paths, exact method signatures, and step-by-step TDD order. Agents have no autonomy to adapt when they discover the prescribed approach doesn't fit.

### 3. Inner loop stages are invisible

No visual indicator of which stage (Discuss/Architect/Execute/Review) the pipeline is in. The orchestrator can silently skip stages. The user has no way to see progress or catch skipped stages without reading artifact directories.

## Architecture

### Change 1: VALIDATE Runtime Testing (Hybrid Approach)

**Backend VALIDATE** adds Playwright API verification:
- Dispatch a subagent that starts the Rails server
- Hit every endpoint from API_CONTRACT.md via Playwright browser_navigate + browser_evaluate
- Verify response status codes match contract
- Verify response shapes (JSON key presence)
- Screenshot error responses as evidence
- Kill server, report PASS/FAIL per endpoint

**Frontend VALIDATE** adds visual QA:
- Invoke /qa-only skill (report-only, no auto-fix)
- Navigates to affected pages from must_haves key_links
- Takes screenshots, checks for console errors, broken layouts
- Produces structured QA report with health score
- Fallback: Playwright MCP tools if /qa-only unavailable

Both are delegated as subagents — the VALIDATE skill gives the agent the goal, agent figures out the testing approach.

### Change 2: Behavior-Slice Task Granularity

**Grouping principle:** Files that import/call each other belong in the same task. Controller calls service? Same task. Two independent services? Separate tasks.

**Task file structure (3 sections):**

```
TASK_NN: [Behavior Name]

Goal: [One sentence — what becomes true when this task is done]

## Acceptance Criteria (must_haves)
  truths: [what must be true — verified by tools]
  artifacts: [what files must exist]
  key_links: [what connections must be wired]

## Locked Decisions (from PLAN — non-negotiable)
  - D-XX: [specific engineering constraint]
  - D-YY: [specific engineering constraint]

## Context
  - Architecture: [reference to execute-locked-decisions.md]
  - Existing patterns: [specific file to use as reference]
  - Prior task: [what TASK_N-1 produced that this task needs]
```

- 2-4 tasks per wave instead of 6-8
- No TDD step-by-step instructions
- Agent decides HOW within locked decision boundaries
- must_haves are the verification contract, not the implementation recipe

### Change 3: Inner Loop Visual Tracking (Shared Reference)

Add to inner-loop-reference.md (inherited by ALL phases, both plugins):

At phase/wave start, create TaskCreate entries for each stage:
```
[Phase/Wave] / Discuss — [descriptive name]
[Phase/Wave] / Architect — [descriptive name]
[Phase/Wave] / Execute — [descriptive name]
[Phase/Wave] / Review — [descriptive name]
```

Mark in_progress on stage entry, completed when artifact written.
Phase-specific gates (DESIGN Gate 1, Gate 2) get their own task entries.

This provides:
- Visual accountability (user sees pending stages)
- Self-regulation (orchestrator follows its own task list)
- Progress tracking across /clear breaks
- Gate visibility (approval gates as distinct tasks)

### How They Connect

Looser task specs (Change 2) require stronger verification (Change 1). Visual tracking (Change 3) ensures the inner loop isn't skipped when agents have more autonomy.

```
DOCUMENT (behavior slices + locked decisions)
  -> BUILD (agents decide HOW, 4-layer verify-fix loop catches mistakes)
    -> VALIDATE (static + runtime + visual QA — actually runs the app)
      -> "Works when you use it"
```

## Files Changed

| File | Plugin | What |
|------|--------|------|
| `shared/references/inner-loop-reference.md` | Shared | Add TaskCreate tracking section |
| `shared/references/task-template.md` | Shared (NEW) | Behavior-slice task template |
| `skills/document/SKILL.md` | Backend | Behavior-slice task granularity |
| `skills/document/SKILL.md` | Frontend | Same |
| `skills/validate/SKILL.md` | Backend | Add Playwright API verification |
| `skills/validate/SKILL.md` | Frontend | Add /qa-only visual QA |

## NOT in Scope

- Changing DISCOVER, PLAN, DESIGN, or BUILD phases (already updated in v3.4.0/v4.1.0)
- Automated visual regression testing (Computer Use — deferred)
- Cross-feature consistency checking (expensive, future improvement)
- Custom Playwright test framework (use raw MCP tools + /qa-only)
- Changing the inner loop stage structure itself (Discuss/Architect/Execute/Review stays)

## What Already Exists (Reused)

- Playwright MCP tools (mcp__plugin_playwright__*) — available in environment
- /qa-only skill (gstack) — report-only visual QA with health scores
- /browse skill (gstack) — headless browser with visual diffs
- 4-layer verify-fix loop (v3.4.0) — per-wave verification already shipped
- verify-must-haves tool — acceptance criteria verification already mechanical
- Decision Ledger + execute-locked-decisions.md — engineering decisions already captured in PLAN

## Open Questions

1. **Rails server in VALIDATE:** Can we reliably start/stop Rails in a subagent context? Need both databases (dev + production) available. May need a health check before running API tests.
2. **Playwright vs /qa-only reliability:** /qa-only depends on gstack's compiled browser binary. If unavailable, Playwright MCP is the fallback. Need to handle both paths.
3. **Task template adoption:** Existing features mid-pipeline have old-format task files. The new template applies to new features only. No migration needed.
