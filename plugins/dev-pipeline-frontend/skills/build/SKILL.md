---
name: build
description: Executes implementation tasks wave-by-wave for a feature. Runs the 4-stage inner loop per wave — each wave gets its own Discuss/Architect/Execute/Review cycle. Dispatches specialized agents per task type. Triggers on /dev:build or when /dev router advances past DOCUMENT.
---

# /dev:build — Wave-by-Wave Implementation

Execute implementation tasks wave by wave. Each wave runs its own full 4-stage inner loop: Discuss, Architect, Execute, Review. Subagents are dispatched for every task — the orchestrator never builds inline.

## Inner Loop (Per Wave)

```
For each wave (wave-01, wave-02, ..., wave-NN):

  ┌─► Discuss → Architect → Execute → Review ─┐
  │                                             │
  │   checkpoint-state, optional /clear         │
  │                                             │
  └──────── next wave ◄────────────────────────┘

After final wave: Review bridges to VALIDATE
```

The inner loop runs ONCE PER WAVE, not once for the entire phase. This is decision D14 from the inner loop reference. Each wave gets its own subdirectory under `.dev/build/wave-NN/`.

---

## Stage 1: Discuss — Implementation Path (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build discuss <feature-dir> --plugin frontend --wave N
```

If FAIL, fix missing prerequisites before proceeding.

**MANDATORY: Load Requirements Context**

Before starting any wave, load `requirements.md` from the feature docs directory. This is the hard contract defining "done" — every build task must work toward satisfying these requirements. Pass relevant requirement IDs to build agents so they know what they're building toward.

### Context Reading

**First wave only:** Read `.dev/document/review-documentation-quality.md` (context bridge from DOCUMENT). If missing, read MANIFEST + wave plans to reconstruct context.

**All waves:** Read before starting each wave.

| File | Extract |
|------|---------|
| `.dev/MANIFEST.md` | Current wave, completed tasks, domains, decision log |
| `waves/WAVE_NN.md` | Tasks, agent assignments, dependencies, completion criteria |
| `01_IMPLEMENTATION_STATUS.md` | What is already done |
| Previous wave's `review-code-quality.md` | Issues, deviations, lessons (skip for wave-01) |

### Questioning

Use `AskUserQuestion` for every question. One question at a time. No cap — user says "enough" to proceed.

**WHAT questions** — the work itself:

- Implementation approach for the tasks in this wave
- Coding standards or conventions to follow
- Test strategy (TDD strict, tests after, skip for now)
- Known gotchas from previous waves or codebase

**HOW meta-questions** — execution strategy:

- "Parallel or sequential agents for this wave?"
- "Code review between individual tasks or end of wave?"
- "TDD strict or flexible for this wave?"
- "Session break after this wave or continue?"
- "Any tasks you want to handle manually instead of subagent dispatch?"

**Optional research pre-step:** User can request codebase exploration before continuing. If opted in, dispatch an Explore agent to scan relevant code, then resume questioning with findings.

### Artifact

```
.dev/build/wave-NN/discuss-implementation-path.md
```

Captures: all Q&A, locked decisions for this wave, execution preferences.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build discuss <feature-dir> --plugin frontend --wave N
```

---

## Stage 2: Architect — Subagent Prompts (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build architect <feature-dir> --plugin frontend --wave N
```

### Prompt Crafting (MANDATORY)

Use `/prompt-generator` to craft EVERY subagent prompt. No exceptions. Prompt quality determines build quality.

For each task in this wave, define:

| Field | Description |
|-------|-------------|
| **Agent type** | From BUILD Agent Map (see below) |
| **Prompt** | Crafted via `/prompt-generator` |
| **File paths** | Exact files to create/modify/test |
| **Codebase context block** | Relevant architecture, patterns, existing code references |
| **Success criteria** | What the subagent output must contain and pass |
| **Escalation rules** | What happens if the task fails |

### Execution Plan

Define execution order based on Discuss decisions: **parallel** (independent tasks in a single message), **sequential** (dependent tasks wait for predecessors), or **hybrid**.

### Codebase Context Block

Every subagent prompt MUST include: architecture decisions from MANIFEST, relevant file paths and patterns, frontend coding rules (`lib/*-api.ts` for API calls, `amber-500` not `orange-*`, `font-display` only on `h1`/`h2`), and design system constraints if applicable.

### Artifact

```
.dev/build/wave-NN/architect-subagent-prompts.md
```

Contains: all subagent assignments, prompts, execution order, success criteria, escalation rules.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build architect <feature-dir> --plugin frontend --wave N
```

---

## Stage 3: Execute — Build Tasks (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build execute <feature-dir> --plugin frontend --wave N
```

**MANDATORY: Pass must_haves to Build Agents**

When crafting the subagent prompt for Execute, include:
1. The `must_haves` block from the current wave file (truths, artifacts, key_links)
2. The requirement IDs this wave covers (from traceability table in requirements.md)
3. This instruction: "Your implementation is verified against these must_haves. Stubs, placeholders, and TODO comments will be flagged as failures. Every truth must be demonstrably true in the code you write."

### Dispatch Rules

**MANDATORY:** Dispatch subagents for every task. The orchestrator NEVER executes work inline (decision D03).

For each task: dispatch via Agent tool, wait for completion, check against success criteria, log result (pass/fail, files changed, deviations).

**Parallel dispatch:** If Architect marked tasks as independent, dispatch ALL in a SINGLE message using multiple Agent tool calls.

**Failure handling:** Log the failure, continue dispatching remaining tasks, surface ALL failures in Review. Do NOT retry during Execute — retries happen after Review via 3-strike escalation.

### Result Recording

For each completed subagent, record: files created/modified (exact paths), test results, deviations from plan, escalations triggered.

### Artifact

```
.dev/build/wave-NN/execute-build-results.md
```

Contains: per-task results, files changed, deviations, failures.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build execute <feature-dir> --plugin frontend --wave N
```

---

## Stage 4: Review — Code Quality (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build review <feature-dir> --plugin frontend --wave N
```

### Mandatory Checks (Every Wave)

These run regardless of user preferences from Discuss:

```bash
npm run type-check    # tsc --noEmit (if TypeScript)
npm run lint          # ESLint
```

Both must pass. If either fails, treat as a simple error — self-fix with one retry before escalating.

### Validation Tool

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build review <feature-dir> --plugin frontend --wave N
```

### Optional Checks (User Decides in Discuss)

Based on HOW answers from Discuss, optionally run:

| Check | Agent | When |
|-------|-------|------|
| Code review | `code-reviewer` | User opted for end-of-wave review |
| Design system compliance | `ui-designer` | MANIFEST domains include `design-system` |
| Test coverage assessment | `test-automator` | User opted for coverage check |
| Accessibility audit | `accessibility-tester` | MANIFEST domains include `accessibility` |

### Verification Checklist

Verify every wave: files match Architect plan, all tasks completed or failures logged, type-check passes, lint passes, tests pass (if written), no regressions, deviations documented.

- [ ] Wave's `must_haves` truths are satisfied by the implementation
- [ ] All artifacts listed in must_haves exist and are substantive (not stubs)
- [ ] Key links in must_haves are wired (components connected, not orphaned)
- [ ] Requirement IDs for this wave are on track to be satisfied

### Surfacing Gaps

Use `AskUserQuestion` to present: task summary, failures/deviations, type-check and lint results, optional check results, recommendations for next wave.

### User Decision (No Auto-Looping — D08)

User picks one:

| Option | When to Use |
|--------|-------------|
| **Accept wave** | All checks pass, output is satisfactory |
| **Retry Execute** | Re-dispatch failed tasks with adjusted prompts |
| **Back to Architect** | Redesign subagent prompts for this wave |
| **Back to Discuss** | Revisit implementation approach for this wave |

### Artifact

```
.dev/build/wave-NN/review-code-quality.md
```

Contains: check results, verdicts, deviations, user decision. For the final wave, this artifact IS the context bridge to VALIDATE.

---

## Between Waves

After a wave is accepted and before starting the next:

### 1. Checkpoint State (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope wave --plugin frontend
```

If FAIL, fix listed issues before proceeding.

### 2. Update Tracking Files

| File | Update |
|------|--------|
| **MANIFEST** | `current_wave`, `build_progress`, task completion status, strike count |
| **01_IMPLEMENTATION_STATUS.md** | Mark completed tasks, note deviations |
| **CURRENT_STATUS.md** | Current wave, what is done, what remains |

### 3. Session Break (Recommended)

Recommend `/clear` between waves for fresh context, especially after 3+ waves, complex escalations, or heavy context. Next session resumes from MANIFEST state via `/dev`.

---

## After Final Wave

When the last wave's Review is accepted:

### 1. Final Checkpoint

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope phase --plugin frontend
```

### 2. Validate MANIFEST

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
```

If FAIL, update MANIFEST before ending.

### 3. Context Bridge

The final wave's `review-code-quality.md` serves as the context bridge to VALIDATE. It must contain: summary of all waves and tasks, cumulative deviations, files created/modified across all waves, outstanding issues, and recommended validation focus areas.

### 4. Transition

Display the Next Up block and STOP:

```
---

### Next Up

Phase: VALIDATE — Type-check, lint, QA, domain audits

`/dev:validate`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke VALIDATE.

---

## BUILD Agent Map

| Task Type | Agent | Notes |
|-----------|-------|-------|
| TypeScript types | `typescript-pro` | Type definitions, interfaces, generics |
| API layer | `frontend-developer` | Fetch hooks, API clients, error handling |
| State management | `react-specialist` | Zustand stores, React Query, context |
| UI components | `frontend-developer` or `react-specialist` | Based on complexity — simple = frontend-developer, stateful = react-specialist |
| Pages/routing | `frontend-developer` | Next.js pages, layouts, navigation |
| Animation/motion | `ui-designer` | Framer Motion, CSS transitions |
| Accessibility | `accessibility-tester` | ARIA, keyboard nav, screen reader |
| Design system | `ui-designer` + `frontend-developer` | Shared components, design tokens |
| Tests | `test-automator` | Unit, integration, E2E |
| Complex bugs | `bug-hunter` + `/investigate` | Hypothesis-driven debugging |

Select agent type during Architect stage based on the task. When a task spans multiple types, use the primary type's agent and include secondary concerns in the prompt.

---

## Error Escalation (3-Strike Rule)

Track strikes PER FEATURE, not per task. Strikes persist across waves.

```
Task fails in Review
  |
  +-- Strike 1: Retry with adjusted prompt
  |     Adjust the subagent prompt based on failure analysis.
  |     Dispatch same agent type with refined instructions.
  |
  +-- Strike 2: Dispatch bug-hunter for investigation
  |     Agent: bug-hunter
  |     Prompt: Include exact error, files changed, task context.
  |     Synthesize findings, apply fix with different strategy.
  |
  +-- Strike 3: STOP. Present all 3 attempts and why each failed.
        Offer options to user:
          1. Guide fix manually — user provides direction
          2. Revise plan — return to PLAN phase
          3. Pause feature entirely — invoke /dev:pause
```

Do NOT attempt a 4th fix without explicit user direction. Each retry MUST use a different strategy — repeating the same approach will not produce a different result.

### Investigation Prompt Template (Strike 2)

```
Investigate this BUILD failure in the Thoven frontend codebase:

TASK: [task name and file]
ERROR: [exact error output]
CONTEXT: [what was being implemented]
FILES CHANGED: [list modified files]
PREVIOUS FIX ATTEMPT: [what was tried in strike 1 and why it failed]

1. Find root cause with file:line references
2. Check if error is in new code or pre-existing
3. Propose 2 fix approaches with trade-offs
4. Recommend which approach and why

CODEBASE: Next.js 14, React 18, Tailwind CSS 4.1, API via lib/*-api.ts
```

---

## Design System Compliance

If MANIFEST domains include `design-system`, the Review stage checks:

- No `orange-*` Tailwind classes (use `amber-500` / `--color-thoven-orange`)
- `font-display` (Fredoka) only on `h1`/`h2` — everything else `font-sans` (Montserrat)
- 3D button pattern: `shadow-[0_4px_0_0_rgb(217,119,6)]`, no borders
- Spring animations: `stiffness: 500, damping: 35, mass: 0.6`
- New components follow existing patterns in `components/ui/`

---

## Directory Structure

```
docs/[Feature]/.dev/build/
├── wave-01/
│   ├── discuss-implementation-path.md
│   ├── architect-subagent-prompts.md
│   ├── execute-build-results.md
│   └── review-code-quality.md
├── wave-02/
│   └── ...
└── wave-NN/
    └── ...
```

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Running inner loop once for all waves | Inner loop runs PER WAVE — each wave gets Discuss/Architect/Execute/Review |
| Executing tasks inline instead of dispatching | MUST dispatch subagents for every task — orchestrator never builds |
| Skipping type-check/lint in Review | Mandatory for every wave, regardless of user preferences |
| Not checkpointing between waves | Always run `checkpoint-state` before `/clear` or starting next wave |
| Skipping `/prompt-generator` in Architect | MANDATORY for every subagent prompt — no shortcuts |
| Repeating same fix strategy on strike 2-3 | Each retry must use a DIFFERENT approach |
| Continuing after 3 strikes | STOP and present options — likely an architectural issue |
| Not updating tracking files between waves | Update MANIFEST, IMPLEMENTATION_STATUS, CURRENT_STATUS after every wave |
| Forgetting previous wave context | Read prior wave's `review-code-quality.md` in Discuss |
| Final wave missing bridge content | Last review must contain cumulative summary for VALIDATE |

---

## Quick Reference

| Item | Location / Value |
|------|-----------------|
| Wave artifacts | `.dev/build/wave-NN/{discuss,architect,execute,review}-*.md` |
| Entry validation | `validate-stage-entry build discuss <dir> --plugin frontend --wave N` |
| Output validation | `validate-stage-output build review <dir> --plugin frontend --wave N` |
| Checkpoint | `checkpoint-state <dir> --scope wave --plugin frontend` |
| Context bridge IN | `.dev/document/review-documentation-quality.md` (first wave only) |
| Context bridge OUT | Final wave's `.dev/build/wave-NN/review-code-quality.md` |
| Strike tracking | Per feature, persists across waves, resets never |
| Agent selection | BUILD Agent Map table above |
| Prompt crafting | `/prompt-generator` — mandatory for every subagent |
| Next phase | VALIDATE (`dev-pipeline-frontend:validate`) |
